import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from 'better-auth/adapters/drizzle'
import { magicLink, organization } from 'better-auth/plugins'
import { Resend } from 'resend'

const db = createDb(serverEnv.databaseUrl)
const resend = new Resend(serverEnv.resendApiKey)

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
        const { error } = await resend.emails.send({
          from: 'Schedulizer <noreply@contact.schedulizer.me>',
          to: email,
          subject: 'Seu link de acesso ao Schedulizer',
          html: `
            <h1>Bem-vindo ao Schedulizer!</h1>
            <p>Clique no link abaixo para acessar sua conta:</p>
            <a href="${verifyUrl}">Acessar Schedulizer</a>
            <p>Este link expira em 10 minutos.</p>
            <p>Se você não solicitou este email, ignore-o.</p>
          `,
        })
        if (error) {
          console.error('Failed to send magic link email', { email, error: error.message })
          throw new Error('Failed to send magic link email')
        }
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
