import * as Sentry from '@sentry/node'

const MAX_BREADCRUMBS = 50
const DEFAULT_TRACES_SAMPLE_RATE = 0
const DEFAULT_PROFILES_SAMPLE_RATE = 0

interface SentryNodeOptions {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  profilesSampleRate?: number
}

function maskDsn(dsn: string): string {
  try {
    const url = new URL(dsn)
    return `${url.protocol}//${url.host}/***`
  } catch {
    return '***'
  }
}

function createSentryNodeConfig(options: SentryNodeOptions): void {
  if (!options.dsn) {
    console.log('Sentry DSN not provided, skipping initialization')
    return
  }
  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    tracesSampleRate: options.tracesSampleRate ?? DEFAULT_TRACES_SAMPLE_RATE,
    profilesSampleRate: options.profilesSampleRate ?? DEFAULT_PROFILES_SAMPLE_RATE,
    maxBreadcrumbs: MAX_BREADCRUMBS,
  })
  console.log('Sentry initialized', {
    dsn: maskDsn(options.dsn),
    environment: options.environment,
  })
}

export type { SentryNodeOptions }
export { createSentryNodeConfig }
