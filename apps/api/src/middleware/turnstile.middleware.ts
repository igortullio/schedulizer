import type { NextFunction, Request, Response } from 'express'
import { verifyTurnstileToken } from '../lib/turnstile'

export async function turnstileMiddleware(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['x-turnstile-token']
  if (!token || typeof token !== 'string') {
    res.status(400).json({ error: 'Missing captcha token' })
    return
  }
  try {
    const isValid = await verifyTurnstileToken(token)
    if (!isValid) {
      res.status(400).json({ error: 'Invalid captcha token' })
      return
    }
    next()
  } catch (error) {
    console.error('Turnstile verification failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    res.status(500).json({ error: 'Captcha verification failed' })
  }
}
