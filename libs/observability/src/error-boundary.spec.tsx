import * as Sentry from '@sentry/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SentryErrorBoundary } from './error-boundary'

vi.mock('@sentry/react', () => ({
  withScope: vi.fn((callback: (scope: unknown) => void) => {
    const scope = {
      setTag: vi.fn(),
      setExtra: vi.fn(),
    }
    callback(scope)
  }),
  captureException: vi.fn(),
}))

describe('SentryErrorBoundary', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('initializes with null error state', () => {
    const boundary = new SentryErrorBoundary({ fallback: null, children: null })
    expect(boundary.state.error).toBeNull()
  })

  it('derives error state from caught error', () => {
    const error = new Error('render error')
    const state = SentryErrorBoundary.getDerivedStateFromError(error)
    expect(state.error).toBe(error)
  })

  it('captures exception with Sentry on componentDidCatch', () => {
    const boundary = new SentryErrorBoundary({ fallback: null, children: null })
    const error = new Error('render error')
    const errorInfo = { componentStack: 'at Component' } as React.ErrorInfo
    boundary.componentDidCatch(error, errorInfo)
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })

  it('sets error boundary context tag on componentDidCatch', () => {
    const boundary = new SentryErrorBoundary({ fallback: null, children: null, context: 'booking-page' })
    const error = new Error('render error')
    const errorInfo = { componentStack: 'at Component' } as React.ErrorInfo
    boundary.componentDidCatch(error, errorInfo)
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setTag: vi.fn(), setExtra: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setTag).toHaveBeenCalledWith('errorBoundary', 'booking-page')
  })

  it('sets component stack as extra on componentDidCatch', () => {
    const boundary = new SentryErrorBoundary({ fallback: null, children: null })
    const error = new Error('render error')
    const errorInfo = { componentStack: 'at MyComponent\nat App' } as React.ErrorInfo
    boundary.componentDidCatch(error, errorInfo)
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setTag: vi.fn(), setExtra: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setExtra).toHaveBeenCalledWith('componentStack', 'at MyComponent\nat App')
  })

  it('renders children when no error', () => {
    const boundary = new SentryErrorBoundary({ fallback: 'fallback', children: 'children' })
    boundary.state = { error: null }
    const result = boundary.render()
    expect(result).toBe('children')
  })

  it('renders fallback when error exists', () => {
    const boundary = new SentryErrorBoundary({ fallback: 'fallback content', children: 'children' })
    boundary.state = { error: new Error('test') }
    const result = boundary.render()
    expect(result).toBe('fallback content')
  })

  it('calls fallback function with error when fallback is a function', () => {
    const fallbackFn = (error: Error) => `Error: ${error.message}`
    const boundary = new SentryErrorBoundary({ fallback: fallbackFn, children: 'children' })
    const error = new Error('test error')
    boundary.state = { error }
    const result = boundary.render()
    expect(result).toBe('Error: test error')
  })
})
