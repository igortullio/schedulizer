import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_API_URL: z.string().url(),
  VITE_TURNSTILE_SITE_KEY: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

function createClientEnv() {
  // In Vite, env vars are available via import.meta.env
  const envSource = typeof import.meta !== 'undefined' ? import.meta.env : process.env

  const result = clientEnvSchema.safeParse(envSource)

  if (!result.success) {
    console.error('Invalid environment variables', JSON.stringify(result.error.format(), null, 2))
    throw new Error('Invalid environment variables.')
  }

  return {
    apiUrl: result.data.VITE_API_URL,
    turnstileSiteKey: result.data.VITE_TURNSTILE_SITE_KEY,
  } as const
}

export const clientEnv = createClientEnv()
