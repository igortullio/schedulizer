import { clientEnv } from '@schedulizer/env/client'
import { createSentryBrowserConfig } from '@schedulizer/observability/browser'

createSentryBrowserConfig({
  dsn: clientEnv.sentryDsnLanding ?? '',
  environment: clientEnv.sentryEnvironment ?? 'development',
  maskAllText: false,
  blockAllMedia: false,
})
