import * as Sentry from '@sentry/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { captureWithContext } from './capture'

vi.mock('@sentry/node', () => ({
  withScope: vi.fn((callback: (scope: unknown) => unknown) => {
    const scope = {
      setUser: vi.fn(),
      setTag: vi.fn(),
      setExtra: vi.fn(),
      setLevel: vi.fn(),
    }
    return callback(scope)
  }),
  captureException: vi.fn(() => 'event-id-123'),
}))

describe('captureWithContext', () => {
  afterEach(() => {
    vi.clearAllMocks()
  })

  it('captures exception and returns event id', () => {
    const error = new Error('test error')
    const result = captureWithContext(error, {})
    expect(result).toBe('event-id-123')
    expect(Sentry.captureException).toHaveBeenCalledWith(error)
  })

  it('sets user context when userId is provided', () => {
    const error = new Error('test error')
    captureWithContext(error, { userId: 'user-1', organizationId: 'org-1' })
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setUser: vi.fn(), setTag: vi.fn(), setExtra: vi.fn(), setLevel: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setUser).toHaveBeenCalledWith({ id: 'user-1', organizationId: 'org-1' })
  })

  it('sets organization tag when organizationId is provided', () => {
    const error = new Error('test error')
    captureWithContext(error, { organizationId: 'org-1' })
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setUser: vi.fn(), setTag: vi.fn(), setExtra: vi.fn(), setLevel: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setTag).toHaveBeenCalledWith('organizationId', 'org-1')
  })

  it('sets custom tags', () => {
    const error = new Error('test error')
    captureWithContext(error, { tags: { route: '/api/test', method: 'POST' } })
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setUser: vi.fn(), setTag: vi.fn(), setExtra: vi.fn(), setLevel: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setTag).toHaveBeenCalledWith('route', '/api/test')
    expect(scope.setTag).toHaveBeenCalledWith('method', 'POST')
  })

  it('sets extra data', () => {
    const error = new Error('test error')
    captureWithContext(error, { extra: { requestBody: { id: 1 } } })
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setUser: vi.fn(), setTag: vi.fn(), setExtra: vi.fn(), setLevel: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setExtra).toHaveBeenCalledWith('requestBody', { id: 1 })
  })

  it('sets error level', () => {
    const error = new Error('test error')
    captureWithContext(error, { level: 'fatal' })
    const scopeCallback = vi.mocked(Sentry.withScope).mock.calls[0][0]
    const scope = { setUser: vi.fn(), setTag: vi.fn(), setExtra: vi.fn(), setLevel: vi.fn() }
    scopeCallback(scope as unknown as Sentry.Scope)
    expect(scope.setLevel).toHaveBeenCalledWith('fatal')
  })
})
