import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateSentryNodeConfig = vi.fn()

vi.mock('@schedulizer/observability/node', () => ({
  createSentryNodeConfig: mockCreateSentryNodeConfig,
}))

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    sentryDsnApi: 'https://key@sentry.io/1',
    sentryEnvironment: 'staging',
    sentryRelease: '1.0.0',
  },
}))

describe('instrument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.resetModules()
  })

  it('calls createSentryNodeConfig with serverEnv values', async () => {
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith({
      dsn: 'https://key@sentry.io/1',
      environment: 'staging',
      release: '1.0.0',
    })
  })

  it('uses empty string as DSN fallback when not set', async () => {
    vi.doMock('@schedulizer/env/server', () => ({
      serverEnv: {
        sentryDsnApi: undefined,
        sentryEnvironment: 'test',
        sentryRelease: undefined,
      },
    }))
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith(expect.objectContaining({ dsn: '' }))
  })
})
