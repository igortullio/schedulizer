import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface RouteLayer {
  route?: {
    methods?: { post?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
}

const mockSession = {
  user: { id: 'user-uuid-123', email: 'test@example.com', name: 'Test User' },
  session: { id: 'session-uuid-123', userId: 'user-uuid-123' },
}

const mockGetSession = vi.fn()
const mockSetActiveOrganization = vi.fn()

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    port: 3000,
    betterAuthSecret: 'test-secret',
    betterAuthUrl: 'http://localhost:3000',
    resendApiKey: 'test-key',
    turnstileSecretKey: 'test-turnstile',
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(() => ({})),
}))

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: (params: unknown) => mockGetSession(params),
      setActiveOrganization: (params: unknown) => mockSetActiveOrganization(params),
    },
  },
}))

import { organizationsRoutes } from '../organizations.routes'

function createMockReqRes(body: unknown, headers: Record<string, string> = {}) {
  const req = {
    body,
    headers,
  } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

describe('Organizations Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have POST /set-active-org route registered', () => {
    const routes = organizationsRoutes.stack as RouteLayer[]
    const postRoute = routes.find(r => r.route?.methods?.post)
    expect(postRoute).toBeDefined()
  })

  describe('Authentication', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const { req, res } = createMockReqRes({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        })
      }
    })
  })

  describe('Validation', () => {
    it('should return 400 for missing organizationId', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      const { req, res } = createMockReqRes({})
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_REQUEST',
            }),
          }),
        )
      }
    })

    it('should return 400 for invalid UUID format', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      const { req, res } = createMockReqRes({
        organizationId: 'not-a-valid-uuid',
      })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              code: 'INVALID_REQUEST',
            }),
          }),
        )
      }
    })
  })

  describe('Organization Selection', () => {
    it('should return 200 when organization is set successfully', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000'
      mockGetSession.mockResolvedValue(mockSession)
      mockSetActiveOrganization.mockResolvedValue({ organizationId })
      const { req, res } = createMockReqRes({ organizationId })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(mockSetActiveOrganization).toHaveBeenCalledWith(
          expect.objectContaining({
            body: { organizationId },
          }),
        )
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { activeOrganizationId: organizationId },
        })
      }
    })

    it('should return 404 when organization does not exist', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockSetActiveOrganization.mockResolvedValue(null)
      const { req, res } = createMockReqRes({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Organization not found', code: 'NOT_FOUND' },
        })
      }
    })

    it('should return 403 when user is not a member of the organization', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockSetActiveOrganization.mockRejectedValue(new Error('User is not a member of this organization'))
      const { req, res } = createMockReqRes({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'User is not a member of this organization', code: 'FORBIDDEN' },
        })
      }
    })

    it('should return 500 on unexpected error', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockSetActiveOrganization.mockRejectedValue(new Error('Database connection failed'))
      const { req, res } = createMockReqRes({
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
        })
      }
    })
  })

  describe('Session Update', () => {
    it('should call setActiveOrganization with correct headers', async () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000'
      mockGetSession.mockResolvedValue(mockSession)
      mockSetActiveOrganization.mockResolvedValue({ organizationId })
      const { req, res } = createMockReqRes({ organizationId }, { cookie: 'session=abc123' })
      const postRoute = (organizationsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
      const handler = postRoute?.route?.stack?.[0]?.handle
      if (handler) {
        await handler(req, res, vi.fn())
        expect(mockSetActiveOrganization).toHaveBeenCalledWith(
          expect.objectContaining({
            body: { organizationId },
            headers: expect.anything(),
          }),
        )
      }
    })
  })
})
