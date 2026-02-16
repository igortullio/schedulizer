import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateSentryNodeConfig = vi.fn()

vi.mock('@schedulizer/observability', () => ({
  createSentryNodeConfig: mockCreateSentryNodeConfig,
}))

describe('instrument', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('calls createSentryNodeConfig with env values', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@sentry.io/1')
    vi.stubEnv('SENTRY_ENVIRONMENT', 'staging')
    vi.stubEnv('SENTRY_RELEASE', '1.0.0')
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith({
      dsn: 'https://key@sentry.io/1',
      environment: 'staging',
      release: '1.0.0',
    })
  })

  it('uses empty string as DSN fallback when not set', async () => {
    delete process.env.SENTRY_DSN
    vi.stubEnv('SENTRY_ENVIRONMENT', 'test')
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith(expect.objectContaining({ dsn: '' }))
  })

  it('uses development as default environment', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@sentry.io/1')
    delete process.env.SENTRY_ENVIRONMENT
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith(expect.objectContaining({ environment: 'development' }))
  })

  it('passes undefined release when not set', async () => {
    vi.stubEnv('SENTRY_DSN', 'https://key@sentry.io/1')
    vi.stubEnv('SENTRY_ENVIRONMENT', 'test')
    delete process.env.SENTRY_RELEASE
    await import('../instrument')
    expect(mockCreateSentryNodeConfig).toHaveBeenCalledWith(expect.objectContaining({ release: undefined }))
  })
})
