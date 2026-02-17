import * as Sentry from '@sentry/react'

const MAX_BREADCRUMBS = 50
const DEFAULT_TRACES_SAMPLE_RATE = 0
const DEFAULT_REPLAYS_SESSION_SAMPLE_RATE = 0.1
const DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0

interface SentryBrowserOptions {
  dsn: string
  environment: string
  release?: string
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
  maskAllText?: boolean
  blockAllMedia?: boolean
}

function maskDsn(dsn: string): string {
  try {
    const url = new URL(dsn)
    return `${url.protocol}//${url.host}/***`
  } catch {
    return '***'
  }
}

function createSentryBrowserConfig(options: SentryBrowserOptions): void {
  if (!options.dsn) {
    console.log('Sentry DSN not provided, skipping initialization')
    return
  }
  Sentry.init({
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: options.maskAllText ?? true,
        blockAllMedia: options.blockAllMedia ?? true,
      }),
    ],
    tracesSampleRate: DEFAULT_TRACES_SAMPLE_RATE,
    replaysSessionSampleRate: options.replaysSessionSampleRate ?? DEFAULT_REPLAYS_SESSION_SAMPLE_RATE,
    replaysOnErrorSampleRate: options.replaysOnErrorSampleRate ?? DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE,
    maxBreadcrumbs: MAX_BREADCRUMBS,
  })
  console.log('Sentry initialized', {
    dsn: maskDsn(options.dsn),
    environment: options.environment,
  })
}

export type { SentryBrowserOptions }
export { createSentryBrowserConfig }
