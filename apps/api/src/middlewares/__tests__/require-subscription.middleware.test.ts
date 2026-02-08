import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    port: 3000,
    betterAuthSecret: 'a'.repeat(32),
    betterAuthUrl: 'http://localhost:3000',
    frontendUrl: 'http://localhost:4200',
    resendApiKey: 'test-key',
    turnstileSecretKey: 'test-turnstile',
    stripeSecretKey: 'sk_test_123',
    stripeWebhookSecret: 'whsec_test_123',
    stripePublishableKey: 'pk_test_123',
  },
}))

const mockSession = {
  user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
  session: { activeOrganizationId: 'org-123' },
}

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: vi.fn(() => Promise.resolve(mockSession)),
    },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(() => ({})),
}))

const mockDbSelect = vi.fn()

vi.mock('@schedulizer/db', () => ({
  createDb: () => ({
    select: (...args: unknown[]) => mockDbSelect(...args),
  }),
  schema: {
    subscriptions: {
      status: 'status',
      currentPeriodEnd: 'current_period_end',
      organizationId: 'organization_id',
    },
  },
}))

import { auth } from '../../lib/auth'
import { requireSubscription } from '../require-subscription.middleware'

function createMockReqRes() {
  const req = { headers: {} } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

function setupMockDbSelect(subscriptions: Array<{ status: string | null; currentPeriodEnd: Date | null }>) {
  mockDbSelect.mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(subscriptions)),
      }),
    }),
  })
}

describe('requireSubscription Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never)
    setupMockDbSelect([])
  })

  describe('Authentication', () => {
    it('should return 401 when session is not found', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never)
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 401 when no active organization is selected', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        session: { activeOrganizationId: null },
      } as never)
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Happy Path - Valid Subscriptions', () => {
    it('should allow request when subscription is active with valid expiration', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'active', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })

    it('should allow request when subscription is trialing with valid expiration', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 14)
      setupMockDbSelect([{ status: 'trialing', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
    })
  })

  describe('Rejection - No Subscription', () => {
    it('should return 403 when no subscription record exists', async () => {
      setupMockDbSelect([])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'No active subscription', code: 'NO_SUBSCRIPTION' },
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Rejection - Expired Subscription', () => {
    it('should return 403 when subscription currentPeriodEnd is in the past', async () => {
      const pastDate = new Date()
      pastDate.setDate(pastDate.getDate() - 1)
      setupMockDbSelect([{ status: 'active', currentPeriodEnd: pastDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription has expired', code: 'SUBSCRIPTION_EXPIRED' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when currentPeriodEnd is null', async () => {
      setupMockDbSelect([{ status: 'active', currentPeriodEnd: null }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription has expired', code: 'SUBSCRIPTION_EXPIRED' },
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Rejection - Invalid Status', () => {
    it('should return 403 when subscription status is canceled', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'canceled', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when subscription status is past_due', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'past_due', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when subscription status is incomplete', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'incomplete', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when subscription status is unpaid', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'unpaid', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when subscription status is paused', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'paused', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should return 403 when subscription status is null', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: null, currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should return 500 when database query fails', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error('Database connection failed')),
          }),
        }),
      })
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
      expect(next).not.toHaveBeenCalled()
    })

    it('should query subscriptions table with correct organizationId', async () => {
      const futureDate = new Date()
      futureDate.setDate(futureDate.getDate() + 30)
      setupMockDbSelect([{ status: 'active', currentPeriodEnd: futureDate }])
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(mockDbSelect).toHaveBeenCalled()
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Error Format Consistency', () => {
    it('should return consistent error format for all error responses', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never)
      const { req, res, next } = createMockReqRes()
      await requireSubscription(req, res, next)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            message: expect.any(String),
            code: expect.any(String),
          }),
        }),
      )
    })
  })
})
