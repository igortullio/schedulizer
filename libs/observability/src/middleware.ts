import * as Sentry from '@sentry/node'
import type { NextFunction, Request, Response } from 'express'

interface AuthenticatedRequest extends Request {
  user?: {
    id: string
    organizationId?: string
  }
}

function sentryContextMiddleware(req: AuthenticatedRequest, _res: Response, next: NextFunction): void {
  if (req.user) {
    Sentry.setUser({ id: req.user.id })
    if (req.user.organizationId) {
      Sentry.setTag('organizationId', req.user.organizationId)
    }
  }
  Sentry.addBreadcrumb({
    category: 'http',
    message: `${req.method} ${req.path}`,
    data: { query: req.query },
    level: 'info',
  })
  next()
}

export type { AuthenticatedRequest }
export { sentryContextMiddleware }
