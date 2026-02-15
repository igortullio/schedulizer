import { createDb, schema } from '@schedulizer/db'
import { DEFAULT_LOCALE, EmailService } from '@schedulizer/email'
import { serverEnv } from '@schedulizer/env/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink, organization } from 'better-auth/plugins'

const db = createDb(serverEnv.databaseUrl)
const emailService = new EmailService({ apiKey: serverEnv.resendApiKey })

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
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        const token = new URL(url).searchParams.get('token')
        const verifyUrl = `${serverEnv.frontendUrl}/auth/verify?token=${token}`
        await emailService.sendMagicLink({
          to: email,
          locale: DEFAULT_LOCALE,
          magicLinkUrl: verifyUrl,
        })
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
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
