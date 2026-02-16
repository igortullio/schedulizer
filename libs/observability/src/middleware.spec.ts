import * as Sentry from '@sentry/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { AuthenticatedRequest } from './middleware'
import { sentryContextMiddleware } from './middleware'

vi.mock('@sentry/node', () => ({
  setUser: vi.fn(),
  setTag: vi.fn(),
  addBreadcrumb: vi.fn(),
}))

function createMockRequest(overrides: Partial<AuthenticatedRequest> = {}): AuthenticatedRequest {
  return {
    method: 'GET',
    path: '/api/test',
    query: {},
    user: undefined,
    ...overrides,
  } as AuthenticatedRequest
}

describe('sentryContextMiddleware', () => {
  const mockNext = vi.fn()

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('calls next', () => {
    const req = createMockRequest()
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(mockNext).toHaveBeenCalled()
  })

  it('sets user when req.user exists', () => {
    const req = createMockRequest({ user: { id: 'user-1' } })
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(Sentry.setUser).toHaveBeenCalledWith({ id: 'user-1' })
  })

  it('sets organization tag when organizationId exists', () => {
    const req = createMockRequest({ user: { id: 'user-1', organizationId: 'org-1' } })
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(Sentry.setTag).toHaveBeenCalledWith('organizationId', 'org-1')
  })

  it('does not set user when req.user is undefined', () => {
    const req = createMockRequest()
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(Sentry.setUser).not.toHaveBeenCalled()
  })

  it('does not set organization tag when organizationId is missing', () => {
    const req = createMockRequest({ user: { id: 'user-1' } })
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(Sentry.setTag).not.toHaveBeenCalled()
  })

  it('adds http breadcrumb', () => {
    const req = createMockRequest({ method: 'POST', path: '/api/users', query: { page: '1' } })
    sentryContextMiddleware(req, {} as never, mockNext)
    expect(Sentry.addBreadcrumb).toHaveBeenCalledWith({
      category: 'http',
      message: 'POST /api/users',
      data: { query: { page: '1' } },
      level: 'info',
    })
  })
})
