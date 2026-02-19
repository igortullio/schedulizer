import 'dotenv/config'
import { z } from 'zod'

export const serverEnvSchema = z.object({
  DATABASE_URL: z.url(),
  SERVER_PORT: z.coerce.number().default(3000),
  BETTER_AUTH_SECRET: z.string().min(32),
  BETTER_AUTH_URL: z.url(),
  FRONTEND_URL: z.url(),
  RESEND_API_KEY: z.string(),
  TURNSTILE_SECRET_KEY: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().startsWith('sk_'),
  STRIPE_WEBHOOK_SECRET: z.string().startsWith('whsec_'),
  CRON_API_KEY: z.string().min(16),
  STRIPE_PRICE_ESSENTIAL_MONTHLY: z.string().startsWith('price_'),
  STRIPE_PRICE_ESSENTIAL_YEARLY: z.string().startsWith('price_'),
  STRIPE_PRICE_PROFESSIONAL_MONTHLY: z.string().startsWith('price_'),
  STRIPE_PRICE_PROFESSIONAL_YEARLY: z.string().startsWith('price_'),
  SENTRY_DSN_API: z.string().optional(),
  SENTRY_ENVIRONMENT: z.string().optional().default('development'),
  SENTRY_RELEASE: z.string().optional(),
  WHATSAPP_PHONE_NUMBER_ID: z.string().min(1),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_VERIFY_TOKEN: z.string().min(1),
  WHATSAPP_APP_SECRET: z.string().min(1),
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
    frontendUrl: result.data.FRONTEND_URL,
    resendApiKey: result.data.RESEND_API_KEY,
    turnstileSecretKey: result.data.TURNSTILE_SECRET_KEY ?? undefined,
    stripeSecretKey: result.data.STRIPE_SECRET_KEY,
    stripeWebhookSecret: result.data.STRIPE_WEBHOOK_SECRET,
    cronApiKey: result.data.CRON_API_KEY,
    stripePriceEssentialMonthly: result.data.STRIPE_PRICE_ESSENTIAL_MONTHLY,
    stripePriceEssentialYearly: result.data.STRIPE_PRICE_ESSENTIAL_YEARLY,
    stripePriceProfessionalMonthly: result.data.STRIPE_PRICE_PROFESSIONAL_MONTHLY,
    stripePriceProfessionalYearly: result.data.STRIPE_PRICE_PROFESSIONAL_YEARLY,
    sentryDsnApi: result.data.SENTRY_DSN_API,
    sentryEnvironment: result.data.SENTRY_ENVIRONMENT,
    sentryRelease: result.data.SENTRY_RELEASE,
    whatsappPhoneNumberId: result.data.WHATSAPP_PHONE_NUMBER_ID,
    whatsappAccessToken: result.data.WHATSAPP_ACCESS_TOKEN,
    whatsappVerifyToken: result.data.WHATSAPP_VERIFY_TOKEN,
    whatsappAppSecret: result.data.WHATSAPP_APP_SECRET,
  } as const
}

export const serverEnv = createServerEnv()
