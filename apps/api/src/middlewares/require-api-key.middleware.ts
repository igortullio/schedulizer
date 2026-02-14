import { serverEnv } from '@schedulizer/env/server'
import type { NextFunction, Request, Response } from 'express'

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-api-key'] as string | undefined
  if (!serverEnv.cronApiKey) {
    console.error('CRON_API_KEY not configured')
    return res.status(500).json({
      error: { message: 'API key not configured', code: 'NOT_CONFIGURED' },
    })
  }
  if (!apiKey || apiKey !== serverEnv.cronApiKey) {
    console.error('Invalid API key attempt', {
      endpoint: req.originalUrl,
    })
    return res.status(401).json({
      error: { message: 'Invalid API key', code: 'INVALID_API_KEY' },
    })
  }
  return next()
}
