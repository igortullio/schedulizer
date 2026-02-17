import { SentryErrorBoundary } from '@schedulizer/observability/browser'
import * as Sentry from '@sentry/react'
import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@sentry/react', () => ({
  captureException: vi.fn(),
  withScope: vi.fn((callback: (scope: unknown) => void) => {
    const scope = {
      setTag: vi.fn(),
      setExtra: vi.fn(),
    }
    callback(scope)
  }),
  init: vi.fn(),
  browserTracingIntegration: vi.fn(() => ({})),
  replayIntegration: vi.fn(() => ({})),
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    sentryDsnWeb: undefined,
    sentryDsnLanding: '',
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

function ThrowingComponent(): never {
  throw new Error('Test rendering error')
}

function SafeComponent() {
  return <div>Safe content</div>
}

describe('SentryErrorBoundary', () => {
  it('should render children when no error occurs', () => {
    render(
      <SentryErrorBoundary fallback={<div>Error occurred</div>}>
        <SafeComponent />
      </SentryErrorBoundary>,
    )
    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  it('should render fallback UI when a child component throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <SentryErrorBoundary fallback={<div>Error occurred</div>}>
        <ThrowingComponent />
      </SentryErrorBoundary>,
    )
    expect(screen.getByText('Error occurred')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('should call Sentry.withScope when an error is caught', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.mocked(Sentry.withScope).mockClear()
    vi.mocked(Sentry.captureException).mockClear()
    render(
      <SentryErrorBoundary fallback={<div>Error occurred</div>} context="global">
        <ThrowingComponent />
      </SentryErrorBoundary>,
    )
    expect(Sentry.withScope).toHaveBeenCalled()
    expect(Sentry.captureException).toHaveBeenCalledWith(expect.any(Error))
    vi.restoreAllMocks()
  })

  it('should render function fallback with error', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    render(
      <SentryErrorBoundary fallback={(error: Error) => <div>Error: {error.message}</div>}>
        <ThrowingComponent />
      </SentryErrorBoundary>,
    )
    expect(screen.getByText('Error: Test rendering error')).toBeInTheDocument()
    vi.restoreAllMocks()
  })

  it('should set errorBoundary tag with context prop', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const mockSetTag = vi.fn()
    vi.mocked(Sentry.withScope).mockImplementation((...args: unknown[]) => {
      const callback = args[0] as (scope: unknown) => void
      const scope = {
        setTag: mockSetTag,
        setExtra: vi.fn(),
      }
      callback(scope)
    })
    render(
      <SentryErrorBoundary fallback={<div>Error occurred</div>} context="global">
        <ThrowingComponent />
      </SentryErrorBoundary>,
    )
    expect(mockSetTag).toHaveBeenCalledWith('errorBoundary', 'global')
    vi.restoreAllMocks()
  })
})
