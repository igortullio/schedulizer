import * as SentryNode from '@sentry/node'
import * as SentryReact from '@sentry/react'

const MAX_BREADCRUMBS = 50
const DEFAULT_TRACES_SAMPLE_RATE = 0
const DEFAULT_PROFILES_SAMPLE_RATE = 0
const DEFAULT_REPLAYS_SESSION_SAMPLE_RATE = 0.1
const DEFAULT_REPLAYS_ON_ERROR_SAMPLE_RATE = 1.0

interface SentryNodeOptions {
  dsn: string
  environment: string
  release?: string
  tracesSampleRate?: number
  profilesSampleRate?: number
}

interface SentryBrowserOptions {
  dsn: string
  environment: string
  release?: string
  replaysSessionSampleRate?: number
  replaysOnErrorSampleRate?: number
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
  SentryNode.init({
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

function createSentryBrowserConfig(options: SentryBrowserOptions): void {
  if (!options.dsn) {
    console.log('Sentry DSN not provided, skipping initialization')
    return
  }
  SentryReact.init({
    dsn: options.dsn,
    environment: options.environment,
    release: options.release,
    integrations: [SentryReact.browserTracingIntegration(), SentryReact.replayIntegration()],
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

export type { SentryNodeOptions, SentryBrowserOptions }
export { createSentryNodeConfig, createSentryBrowserConfig }
