import { createSentryNodeConfig } from '@schedulizer/observability'

createSentryNodeConfig({
  dsn: process.env.SENTRY_DSN ?? '',
  environment: process.env.SENTRY_ENVIRONMENT ?? 'development',
  release: process.env.SENTRY_RELEASE,
})
