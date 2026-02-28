import { serverEnv } from '@schedulizer/env/server'

const TURNSTILE_VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify'

interface TurnstileVerifyResponse {
  success: boolean
  'error-codes': string[]
}

export async function verifyTurnstileToken(token: string): Promise<boolean> {
  const response = await fetch(TURNSTILE_VERIFY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: serverEnv.turnstileSecretKey,
      response: token,
    }),
  })
  const data = (await response.json()) as TurnstileVerifyResponse
  return data.success
}
