import 'dotenv/config'
import { z } from 'zod'

const serverEnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  SERVER_PORT: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string(),
  TURNSTILE_SECRET_KEY: z.string(),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function createServerEnv() {
  const result = serverEnvSchema.safeParse(process.env)

  if (!result.success) {
    console.error('Invalid environment variables', JSON.stringify(result.error.format(), null, 2))
    throw new Error('Invalid environment variables.')
  }

  return {
    databaseUrl: result.data.DATABASE_URL,
    port: result.data.SERVER_PORT,
    betterAuthSecret: result.data.BETTER_AUTH_SECRET,
    betterAuthUrl: result.data.BETTER_AUTH_URL,
    resendApiKey: result.data.RESEND_API_KEY,
    turnstileSecretKey: result.data.TURNSTILE_SECRET_KEY,
  } as const
}

export const serverEnv = createServerEnv()
