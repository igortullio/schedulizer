import { clientEnv } from '@schedulizer/env/client'
import { createSentryBrowserConfig } from '@schedulizer/observability/browser'

createSentryBrowserConfig({
  dsn: clientEnv.sentryDsnWeb ?? '',
  environment: clientEnv.sentryEnvironment ?? 'development',
})
