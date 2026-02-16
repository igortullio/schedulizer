import * as SentryNode from '@sentry/node'
import * as SentryReact from '@sentry/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSentryBrowserConfig, createSentryNodeConfig } from './sentry-config'

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
}))

vi.mock('@sentry/react', () => ({
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => 'browserTracing'),
  replayIntegration: vi.fn(() => 'replay'),
}))

describe('createSentryNodeConfig', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls SentryNode.init with provided options', () => {
    createSentryNodeConfig({ dsn: 'https://key@sentry.io/1', environment: 'production' })
    expect(SentryNode.init).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: 'https://key@sentry.io/1',
        environment: 'production',
        maxBreadcrumbs: 50,
      }),
    )
  })

  it('uses default tracesSampleRate of 0', () => {
    createSentryNodeConfig({ dsn: 'https://key@sentry.io/1', environment: 'test' })
    expect(SentryNode.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 0 }))
  })

  it('overrides tracesSampleRate when provided', () => {
    createSentryNodeConfig({ dsn: 'https://key@sentry.io/1', environment: 'test', tracesSampleRate: 0.5 })
    expect(SentryNode.init).toHaveBeenCalledWith(expect.objectContaining({ tracesSampleRate: 0.5 }))
  })

  it('passes release when provided', () => {
    createSentryNodeConfig({ dsn: 'https://key@sentry.io/1', environment: 'test', release: '1.0.0' })
    expect(SentryNode.init).toHaveBeenCalledWith(expect.objectContaining({ release: '1.0.0' }))
  })

  it('skips initialization when DSN is empty', () => {
    createSentryNodeConfig({ dsn: '', environment: 'test' })
    expect(SentryNode.init).not.toHaveBeenCalled()
  })

  it('logs masked DSN on initialization', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    createSentryNodeConfig({ dsn: 'https://key@sentry.io/1', environment: 'production' })
    expect(consoleSpy).toHaveBeenCalledWith('Sentry initialized', {
      dsn: 'https://sentry.io/***',
      environment: 'production',
    })
    consoleSpy.mockRestore()
  })

  it('logs skip message when DSN is empty', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    createSentryNodeConfig({ dsn: '', environment: 'test' })
    expect(consoleSpy).toHaveBeenCalledWith('Sentry DSN not provided, skipping initialization')
    consoleSpy.mockRestore()
  })
})

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
