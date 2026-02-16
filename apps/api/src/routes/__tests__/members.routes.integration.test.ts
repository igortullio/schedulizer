import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000'
const ORGANIZATION_ID = '660e8400-e29b-41d4-a716-446655440000'
const USER_ID = 'user-uuid-123'

const mockSession = {
  user: { id: USER_ID, email: 'test@example.com', name: 'Test User' },
  session: { id: 'session-uuid-123', userId: USER_ID, activeOrganizationId: ORGANIZATION_ID },
}

const mockGetSession = vi.fn()
const mockRemoveMember = vi.fn()
const mockDbSelect = vi.fn()

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
      removeMember: (params: unknown) => mockRemoveMember(params),
    },
  },
}))

vi.mock('@schedulizer/db', () => {
  const chainable = {
    from: () => chainable,
    innerJoin: () => chainable,
    where: () => chainable,
    limit: () => mockDbSelect(),
  }
  return {
    createDb: vi.fn(() => ({
      select: () => chainable,
    })),
    schema: {
      members: { role: 'role', userId: 'user_id', organizationId: 'organization_id' },
      invitations: {
        id: 'id',
        email: 'email',
        role: 'role',
        status: 'status',
        expiresAt: 'expires_at',
        organizationId: 'organization_id',
        inviterId: 'inviter_id',
      },
      organizations: { id: 'id', name: 'name' },
      users: { id: 'id', name: 'name' },
    },
  }
})

import { invitationsRoutes, membersRoutes } from '../members.routes'

type RouterType = typeof membersRoutes

interface RouteLayer {
  route?: {
    path?: string
    methods?: { post?: boolean; get?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
}

function findRouteHandler(router: RouterType, method: 'post' | 'get', path: string) {
  const routes = router.stack as RouteLayer[]
  const route = routes.find(r => r.route?.methods?.[method] && r.route?.path === path)
  return route?.route?.stack?.[0]?.handle
}

function createMockReqRes(body: unknown, params: Record<string, string> = {}, headers: Record<string, string> = {}) {
  const req = { body, params, headers } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

describe('Members Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /leave', () => {
    it('should return 401 when user is not authenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    })

    it('should return 400 when no active organization', async () => {
      mockGetSession.mockResolvedValue({
        ...mockSession,
        session: { ...mockSession.session, activeOrganizationId: null },
      })
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
      })
    })

    it('should return 404 when member is not found', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockDbSelect.mockResolvedValue([])
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Member not found', code: 'NOT_FOUND' },
      })
    })

    it('should return 403 when owner tries to leave', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockDbSelect.mockResolvedValue([{ role: 'owner' }])
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Owner cannot leave organization', code: 'OWNER_CANNOT_LEAVE' },
      })
    })

    it('should return 200 when member leaves successfully', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockDbSelect.mockResolvedValue([{ role: 'member' }])
      mockRemoveMember.mockResolvedValue({})
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(mockRemoveMember).toHaveBeenCalledWith(
        expect.objectContaining({
          body: { memberIdOrEmail: USER_ID, organizationId: ORGANIZATION_ID },
        }),
      )
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: { message: 'Successfully left organization' },
      })
    })

    it('should return 200 when admin leaves successfully', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockDbSelect.mockResolvedValue([{ role: 'admin' }])
      mockRemoveMember.mockResolvedValue({})
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
    })

    it('should return 500 on unexpected error', async () => {
      mockGetSession.mockResolvedValue(mockSession)
      mockDbSelect.mockRejectedValue(new Error('Database error'))
      const { req, res } = createMockReqRes({})
      const handler = findRouteHandler(membersRoutes, 'post', '/leave')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
    })
  })

  describe('GET /invitations/:id', () => {
    it('should return 400 for invalid invitation ID', async () => {
      const { req, res } = createMockReqRes({}, { id: 'not-a-uuid' })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Invalid invitation ID', code: 'INVALID_REQUEST' },
      })
    })

    it('should return 404 when invitation not found', async () => {
      mockDbSelect.mockResolvedValue([])
      const { req, res } = createMockReqRes({}, { id: VALID_UUID })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(404)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Invitation not found', code: 'NOT_FOUND' },
      })
    })

    it('should return 410 when invitation status is not pending', async () => {
      mockDbSelect.mockResolvedValue([
        {
          id: VALID_UUID,
          email: 'invited@test.com',
          role: 'member',
          status: 'accepted',
          expiresAt: new Date(Date.now() + 86400000),
          organizationName: 'Test Org',
          inviterName: 'Test User',
        },
      ])
      const { req, res } = createMockReqRes({}, { id: VALID_UUID })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(410)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Invitation is no longer valid', code: 'INVITATION_INVALID' },
      })
    })

    it('should return 410 when invitation has expired', async () => {
      mockDbSelect.mockResolvedValue([
        {
          id: VALID_UUID,
          email: 'invited@test.com',
          role: 'member',
          status: 'pending',
          expiresAt: new Date(Date.now() - 86400000),
          organizationName: 'Test Org',
          inviterName: 'Test User',
        },
      ])
      const { req, res } = createMockReqRes({}, { id: VALID_UUID })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(410)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Invitation has expired', code: 'INVITATION_EXPIRED' },
      })
    })

    it('should return 200 with invitation data for valid pending invitation', async () => {
      const futureDate = new Date(Date.now() + 86400000)
      mockDbSelect.mockResolvedValue([
        {
          id: VALID_UUID,
          email: 'invited@test.com',
          role: 'member',
          status: 'pending',
          expiresAt: futureDate,
          organizationName: 'Test Org',
          inviterName: 'Test User',
        },
      ])
      const { req, res } = createMockReqRes({}, { id: VALID_UUID })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          id: VALID_UUID,
          organizationName: 'Test Org',
          inviterName: 'Test User',
          email: 'invited@test.com',
          role: 'member',
          status: 'pending',
          expiresAt: futureDate,
        },
      })
    })

    it('should return 500 on unexpected error', async () => {
      mockDbSelect.mockRejectedValue(new Error('Database error'))
      const { req, res } = createMockReqRes({}, { id: VALID_UUID })
      const handler = findRouteHandler(invitationsRoutes, 'get', '/:id')
      expect(handler).toBeDefined()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
    })
  })
})
