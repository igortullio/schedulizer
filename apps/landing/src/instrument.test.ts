import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockCreateSentryBrowserConfig = vi.fn()

vi.mock('@schedulizer/observability/browser', () => ({
  createSentryBrowserConfig: mockCreateSentryBrowserConfig,
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    sentryDsnWeb: undefined,
    sentryDsnLanding: 'https://examplePublicKey@o0.ingest.sentry.io/0',
    sentryEnvironment: 'test',
    apiUrl: '',
    webUrl: undefined,
    turnstileSiteKey: undefined,
    stripePublishableKey: '',
    stripePriceEssentialMonthly: '',
    stripePriceEssentialYearly: '',
    stripePriceProfessionalMonthly: '',
    stripePriceProfessionalYearly: '',
  },
}))

describe('instrument', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateSentryBrowserConfig.mockClear()
  })

  it('should call createSentryBrowserConfig with DSN and environment from clientEnv', async () => {
    await import('./instrument')
    expect(mockCreateSentryBrowserConfig).toHaveBeenCalledWith({
      dsn: 'https://examplePublicKey@o0.ingest.sentry.io/0',
      environment: 'test',
      maskAllText: false,
      blockAllMedia: false,
    })
  })

  it('should call createSentryBrowserConfig exactly once', async () => {
    await import('./instrument')
    expect(mockCreateSentryBrowserConfig).toHaveBeenCalledTimes(1)
  })
})

describe('instrument with missing DSN', () => {
  beforeEach(() => {
    vi.resetModules()
    mockCreateSentryBrowserConfig.mockClear()
    vi.doMock('@schedulizer/env/client', () => ({
      clientEnv: {
        sentryDsnWeb: undefined,
        sentryDsnLanding: undefined,
        sentryEnvironment: 'development',
        apiUrl: '',
        webUrl: undefined,
        turnstileSiteKey: undefined,
        stripePublishableKey: '',
        stripePriceEssentialMonthly: '',
        stripePriceEssentialYearly: '',
        stripePriceProfessionalMonthly: '',
        stripePriceProfessionalYearly: '',
      },
    }))
  })

  it('should pass empty string as DSN when VITE_SENTRY_DSN is not provided', async () => {
    await import('./instrument')
    expect(mockCreateSentryBrowserConfig).toHaveBeenCalledWith({
      dsn: '',
      environment: 'development',
      maskAllText: false,
      blockAllMedia: false,
    })
  })
})
