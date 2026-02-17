import { fromNodeHeaders } from 'better-auth/node'
import type { NextFunction, Request, Response } from 'express'
import { auth } from '../lib/auth'

export function requirePermission(resource: string, action: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const session = await auth.api.getSession({
        headers: fromNodeHeaders(req.headers),
      })
      if (!session) {
        return res.status(401).json({
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        })
      }
      const hasPermission = await auth.api.hasPermission({
        headers: fromNodeHeaders(req.headers),
        body: { permission: { [resource]: [action] } },
      })
      if (!hasPermission?.success) {
        console.error('Permission denied', {
          userId: session.user.id,
          resource,
          action,
        })
        return res.status(403).json({
          error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
        })
      }
      return next()
    } catch (error) {
      console.error('Permission middleware error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
      })
      return res.status(500).json({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
    }
  }
}
