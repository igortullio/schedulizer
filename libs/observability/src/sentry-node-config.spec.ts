import * as SentryNode from '@sentry/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createSentryNodeConfig } from './sentry-node-config'

vi.mock('@sentry/node', () => ({
  init: vi.fn(),
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
