import * as Sentry from '@sentry/node'

interface CaptureContext {
  userId?: string
  organizationId?: string
  extra?: Record<string, unknown>
  tags?: Record<string, string>
  level?: 'fatal' | 'error' | 'warning' | 'info'
}

function captureWithContext(error: Error, context: CaptureContext): string {
  return Sentry.withScope(scope => {
    if (context.userId || context.organizationId) {
      scope.setUser({
        id: context.userId,
        organizationId: context.organizationId,
      } as Sentry.User)
    }
    if (context.organizationId) {
      scope.setTag('organizationId', context.organizationId)
    }
    if (context.tags) {
      for (const [key, value] of Object.entries(context.tags)) {
        scope.setTag(key, value)
      }
    }
    if (context.extra) {
      for (const [key, value] of Object.entries(context.extra)) {
        scope.setExtra(key, value)
      }
    }
    if (context.level) {
      scope.setLevel(context.level)
    }
    return Sentry.captureException(error)
  })
}

export type { CaptureContext }
export { captureWithContext }
