import { ensureUserExists, getVerificationToken } from './db'

const API_BASE_URL = 'http://localhost:3000'
const FRONTEND_BASE_URL = 'http://localhost:4200'
const MAX_TOKEN_WAIT_TIME_MS = 5000
const TOKEN_POLL_INTERVAL_MS = 500

interface MagicLinkApiResponse {
  status?: boolean
  error?: string
}

export async function requestMagicLink(email: string): Promise<void> {
  try {
    await ensureUserExists(email)

    const response = await fetch(`${API_BASE_URL}/api/auth/sign-in/magic-link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        callbackURL: `${FRONTEND_BASE_URL}/auth/verify`,
      }),
    })

    if (!response.ok) {
      const errorData = (await response.json()) as MagicLinkApiResponse
      throw new Error(errorData.error || `API request failed with status ${response.status}`)
    }

    const data = (await response.json()) as MagicLinkApiResponse

    if (!data.status) {
      throw new Error('Magic link request did not return success status')
    }
  } catch (error) {
    console.error('Failed to request magic link', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

export async function getMagicLinkUrl(email: string): Promise<string> {
  const startTime = Date.now()

  while (Date.now() - startTime < MAX_TOKEN_WAIT_TIME_MS) {
    const token = await getVerificationToken(email)

    if (token) {
      return `${FRONTEND_BASE_URL}/auth/verify?token=${token}`
    }

    await new Promise(resolve => setTimeout(resolve, TOKEN_POLL_INTERVAL_MS))
  }

  throw new Error(`Magic link token not found for email ${email} after ${MAX_TOKEN_WAIT_TIME_MS}ms`)
}

export async function loginWithMagicLink(email: string): Promise<string> {
  try {
    await requestMagicLink(email)
    const verifyUrl = await getMagicLinkUrl(email)

    console.log('Magic link flow completed', { email })

    return verifyUrl
  } catch (error) {
    console.error('Magic link login failed', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
