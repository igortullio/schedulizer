import * as SentryReact from '@sentry/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSentryBrowserConfig } from './sentry-browser-config'

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => 'browserTracing'),
  replayIntegration: vi.fn(() => 'replay'),
}))

describe('createSentryBrowserConfig', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls SentryReact.init with provided options', () => {
    createSentryBrowserConfig({ dsn: 'https://key@sentry.io/2', environment: 'production' })
    expect(SentryReact.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.io/2',
        environment: 'production',
        maxBreadcrumbs: 50,
      }),
    )
  })

  it('includes browser integrations', () => {
    createSentryBrowserConfig({ dsn: 'https://key@sentry.io/2', environment: 'test' })
    expect(SentryReact.init).toHaveBeenCalledWith(
      expect.objectContaining({ integrations: ['browserTracing', 'replay'] }),
    )
  })

  it('uses default replay sample rates', () => {
    createSentryBrowserConfig({ dsn: 'https://key@sentry.io/2', environment: 'test' })
    expect(SentryReact.init).toHaveBeenCalledWith(
      expect.objectContaining({
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      }),
    )
  })

  it('overrides replay sample rates when provided', () => {
    createSentryBrowserConfig({
      dsn: 'https://key@sentry.io/2',
      environment: 'test',
      replaysSessionSampleRate: 0.5,
      replaysOnErrorSampleRate: 0.8,
    })
    expect(SentryReact.init).toHaveBeenCalledWith(
      expect.objectContaining({
        replaysSessionSampleRate: 0.5,
        replaysOnErrorSampleRate: 0.8,
      }),
    )
  })

  it('skips initialization when DSN is empty', () => {
    createSentryBrowserConfig({ dsn: '', environment: 'test' })
    expect(SentryReact.init).not.toHaveBeenCalled()
  })

  it('logs masked DSN on initialization', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    createSentryBrowserConfig({ dsn: 'https://key@sentry.io/2', environment: 'staging' })
    expect(consoleSpy).toHaveBeenCalledWith('Sentry initialized', {
      dsn: 'https://sentry.io/***',
      environment: 'staging',
    })
    consoleSpy.mockRestore()
  })
})
