import { clientEnv } from '@schedulizer/env/client'
import { createSentryBrowserConfig } from '@schedulizer/observability'

createSentryBrowserConfig({
  dsn: clientEnv.sentryDsn ?? '',
  environment: clientEnv.sentryEnvironment ?? 'development',
})
