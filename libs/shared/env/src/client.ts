import { z } from 'zod'

const clientEnvSchema = z.object({
  VITE_API_URL: z.url(),
  VITE_TURNSTILE_SITE_KEY: z.string().optional(),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

interface ParsedClientEnv {
  apiUrl: string
  turnstileSiteKey: string | undefined
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
      turnstileSiteKey: result.data.VITE_TURNSTILE_SITE_KEY,
    },
    error: null,
  }
}

const clientEnvResult = createClientEnv()

export const clientEnv: ParsedClientEnv = clientEnvResult.success
  ? clientEnvResult.env
  : { apiUrl: '', turnstileSiteKey: undefined }

export const clientEnvError = clientEnvResult.success ? null : clientEnvResult.error

export function hasEnvError(): boolean {
  return !clientEnvResult.success
}

export function getEnvError(): string | null {
  return clientEnvResult.success ? null : clientEnvResult.error
}
