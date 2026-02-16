import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_WEB_URL: z.url().optional(),
  VITE_TURNSTILE_SITE_KEY: z.string().optional(),
  VITE_STRIPE_PUBLISHABLE_KEY: z.string().min(1),
  VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_ESSENTIAL_YEARLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY: z.string().startsWith('price_'),
  VITE_STRIPE_PRICE_PROFESSIONAL_YEARLY: z.string().startsWith('price_'),
  VITE_SENTRY_DSN: z.string().optional(),
  VITE_SENTRY_ENVIRONMENT: z.string().optional().default('development'),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

interface ParsedClientEnv {
  apiUrl: string
  webUrl: string | undefined
  turnstileSiteKey: string | undefined
  stripePublishableKey: string
  stripePriceEssentialMonthly: string
  stripePriceEssentialYearly: string
  stripePriceProfessionalMonthly: string
  stripePriceProfessionalYearly: string
  sentryDsn: string | undefined
  sentryEnvironment: string | undefined
}

type ClientEnvResult =
  | { success: true; env: ParsedClientEnv; error: null }
  | { success: false; env: null; error: string }

function createClientEnv(): ClientEnvResult {
  const envSource = typeof import.meta !== 'undefined' ? import.meta.env : process.env
  const result = clientEnvSchema.safeParse(envSource)
  if (!result.success) {
    const issues = result.error.issues
    const missingVars = issues.map(issue => issue.path.join('.'))
    console.error('Missing environment variables:', missingVars.join(', '))
    return {
      success: false,
      env: null,
      error: `Missing environment variables: ${missingVars.join(', ')}. Check your .env file.`,
    }
  }
  return {
    success: true,
    env: {
      apiUrl: result.data.VITE_API_URL,
      webUrl: result.data.VITE_WEB_URL,
      turnstileSiteKey: result.data.VITE_TURNSTILE_SITE_KEY,
      stripePublishableKey: result.data.VITE_STRIPE_PUBLISHABLE_KEY,
      stripePriceEssentialMonthly: result.data.VITE_STRIPE_PRICE_ESSENTIAL_MONTHLY,
      stripePriceEssentialYearly: result.data.VITE_STRIPE_PRICE_ESSENTIAL_YEARLY,
      stripePriceProfessionalMonthly: result.data.VITE_STRIPE_PRICE_PROFESSIONAL_MONTHLY,
      stripePriceProfessionalYearly: result.data.VITE_STRIPE_PRICE_PROFESSIONAL_YEARLY,
      sentryDsn: result.data.VITE_SENTRY_DSN,
      sentryEnvironment: result.data.VITE_SENTRY_ENVIRONMENT,
    },
    error: null,
  }
}

const clientEnvResult = createClientEnv()

export const clientEnv: ParsedClientEnv = clientEnvResult.success
  ? clientEnvResult.env
  : {
      apiUrl: '',
      webUrl: undefined,
      turnstileSiteKey: undefined,
      stripePublishableKey: '',
      stripePriceEssentialMonthly: '',
      stripePriceEssentialYearly: '',
      stripePriceProfessionalMonthly: '',
      stripePriceProfessionalYearly: '',
      sentryDsn: undefined,
      sentryEnvironment: undefined,
    }

export const clientEnvError = clientEnvResult.success ? null : clientEnvResult.error

export function hasEnvError(): boolean {
  return !clientEnvResult.success
}

export function getEnvError(): string | null {
  return clientEnvResult.success ? null : clientEnvResult.error
}
