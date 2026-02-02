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
    schema,
  }),
  secret: serverEnv.betterAuthSecret,
  baseURL: serverEnv.betterAuthUrl,
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    magicLink({
      sendMagicLink: async ({ email, url }) => {
        await resend.emails.send({
          from: 'Schedulizer <noreply@schedulizer.app>',
          to: email,
          subject: 'Seu link de acesso ao Schedulizer',
          html: `
            <h1>Bem-vindo ao Schedulizer!</h1>
            <p>Clique no link abaixo para acessar sua conta:</p>
            <a href="${url}">Acessar Schedulizer</a>
            <p>Este link expira em 10 minutos.</p>
            <p>Se você não solicitou este email, ignore-o.</p>
          `,
        })
      },
    }),
    organization({
      allowUserToCreateOrganization: true,
    }),
  ],
  advanced: {
    crossSubDomainCookies: {
      enabled: false,
    },
  },
})

export type Auth = typeof auth
