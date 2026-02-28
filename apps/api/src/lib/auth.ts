import { createDb, schema } from '@schedulizer/db'
import { DEFAULT_LOCALE, EmailService } from '@schedulizer/email'
import { serverEnv } from '@schedulizer/env/server'
import {
  buildLoginVerificationComponents,
  LOGIN_VERIFICATION_TEMPLATE_NAME,
  WhatsAppService,
} from '@schedulizer/whatsapp'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { APIError } from 'better-auth/api'
import { magicLink, organization, phoneNumber } from 'better-auth/plugins'
import { ac, adminRole, memberRole, ownerRole } from './access-control'
import { checkMemberLimit } from './member-limit-guard'

const INVITATION_EXPIRES_IN_SECONDS = 604800
const E164_PATTERN = /^\+[1-9]\d{7,14}$/
const PENDING_NAME_TTL_MS = 10 * 60 * 1000

const pendingNames = new Map<string, { name: string; expiresAt: number }>()

function cleanExpiredPendingNames() {
  const now = Date.now()
  for (const [key, entry] of pendingNames) {
    if (entry.expiresAt <= now) pendingNames.delete(key)
  }
}

export function setPendingName(phone: string, name: string) {
  cleanExpiredPendingNames()
  pendingNames.set(phone, { name, expiresAt: Date.now() + PENDING_NAME_TTL_MS })
}

export function getPendingName(phone: string): string | null {
  const entry = pendingNames.get(phone)
  if (!entry) return null
  if (entry.expiresAt <= Date.now()) {
    pendingNames.delete(phone)
    return null
  }
  pendingNames.delete(phone)
  return entry.name
}

const db = createDb(serverEnv.databaseUrl)
const emailService = new EmailService({ apiKey: serverEnv.resendApiKey })
const whatsAppService = new WhatsAppService({
  phoneNumberId: serverEnv.whatsappPhoneNumberId,
  accessToken: serverEnv.whatsappAccessToken,
  apiVersion: 'v21.0',
})

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
      organization: schema.organizations,
      member: schema.members,
      invitation: schema.invitations,
    },
  }),
  secret: serverEnv.betterAuthSecret,
  baseURL: serverEnv.betterAuthUrl,
  trustedOrigins: ['http://localhost:4200', 'https://app.schedulizer.me'],
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    phoneNumber({
      sendOTP: async ({ phoneNumber: phone, code }) => {
        const pendingName = getPendingName(phone)
        let urlSuffix = `?code=${code}&phone=${encodeURIComponent(phone)}`
        if (pendingName) {
          urlSuffix += `&name=${encodeURIComponent(pendingName)}`
        }
        if (phone.startsWith('+0') || phone.includes('e2e')) {
          console.log('E2E test phone OTP', { phone, code })
          return
        }
        const result = await whatsAppService.sendTemplate({
          to: phone.replace('+', ''),
          templateName: LOGIN_VERIFICATION_TEMPLATE_NAME,
          languageCode: 'pt_BR',
          components: buildLoginVerificationComponents(urlSuffix),
        })
        console.log('result', result)
        if (!result.success) {
          throw new Error('Failed to send WhatsApp OTP')
        }
      },
      signUpOnVerification: {
        getTempEmail: () => null as unknown as string,
      },
      phoneNumberValidator: phone => E164_PATTERN.test(phone),
    }),
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const parsedUrl = new URL(url)
        const token = parsedUrl.searchParams.get('token')
        const callbackURL = parsedUrl.searchParams.get('callbackURL')
        const verifyUrl = new URL(`${serverEnv.frontendUrl}/auth/verify`)
        verifyUrl.searchParams.set('token', token ?? '')
        if (callbackURL) {
          const callbackParsed = new URL(callbackURL, serverEnv.frontendUrl)
          const redirect = callbackParsed.searchParams.get('redirect')
          if (redirect) {
            verifyUrl.searchParams.set('redirect', redirect)
          }
        }
        if (email.startsWith('e2e-')) {
          console.log('E2E test magic link', { email, token, verifyUrl: verifyUrl.toString() })
          return
        }
        await emailService.sendMagicLink({
          to: email,
          locale: DEFAULT_LOCALE,
          magicLinkUrl: verifyUrl.toString(),
        })
      },
    }),
    organization({
      ac,
      roles: {
        owner: ownerRole,
        admin: adminRole,
        member: memberRole,
      },
      allowUserToCreateOrganization: true,
      invitationExpiresIn: INVITATION_EXPIRES_IN_SECONDS,
      async sendInvitationEmail(data) {
        const inviteUrl = `${serverEnv.frontendUrl}/invite/${data.id}`
        console.log('Invitation created', {
          invitationId: data.id,
          organizationId: data.organization.id,
        })
        await emailService.sendInvitation({
          to: data.email,
          locale: DEFAULT_LOCALE,
          inviterName: data.inviter.user.name ?? '',
          organizationName: data.organization.name,
          inviteUrl,
          role: data.role ?? 'member',
        })
      },
      organizationHooks: {
        beforeAddMember: async ({ organization: org }) => {
          const result = await checkMemberLimit(org.id)
          if (!result.allowed) {
            throw new APIError('FORBIDDEN', {
              message:
                result.reason === 'no_subscription' ? 'No active subscription' : 'Plan limit exceeded for members',
            })
          }
        },
      },
    }),
  ],
  advanced: {
    database: {
      generateId: 'uuid',
    },
    crossSubDomainCookies: {
      enabled: false,
    },
  },
})

export type Auth = typeof auth
