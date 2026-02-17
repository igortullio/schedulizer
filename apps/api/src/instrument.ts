import { serverEnv } from '@schedulizer/env/server'
import { createSentryNodeConfig } from '@schedulizer/observability/node'

createSentryNodeConfig({
  dsn: serverEnv.sentryDsnApi ?? '',
  environment: serverEnv.sentryEnvironment,
  release: serverEnv.sentryRelease,
})
