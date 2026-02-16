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
    stripePriceEssentialMonthly: 'price_essential_monthly',
    stripePriceEssentialYearly: 'price_essential_yearly',
    stripePriceProfessionalMonthly: 'price_professional_monthly',
    stripePriceProfessionalYearly: 'price_professional_yearly',
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
      hasPermission: vi.fn(() => Promise.resolve({ success: true })),
    },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(() => ({})),
}))

import { auth } from '../../lib/auth'
import { requirePermission } from '../require-permission.middleware'

function createMockReqRes() {
  const req = { headers: {} } as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('requirePermission Middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(auth.api.getSession).mockResolvedValue(mockSession as never)
    vi.mocked(auth.api.hasPermission).mockResolvedValue({ success: true } as never)
  })

  describe('Authentication', () => {
    it('should return 401 when session is not found', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never)
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'update')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
      expect(next).not.toHaveBeenCalled()
    })
  })

  describe('Permission Check', () => {
    it('should call next when user has permission', async () => {
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'update')(req, res, next)
      expect(next).toHaveBeenCalled()
      expect(res.status).not.toHaveBeenCalled()
      expect(auth.api.hasPermission).toHaveBeenCalledWith({
        headers: expect.anything(),
        body: { permission: { organization: ['update'] } },
      })
    })

    it('should return 403 when user lacks permission', async () => {
      vi.mocked(auth.api.hasPermission).mockResolvedValueOnce({ success: false } as never)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { req, res, next } = createMockReqRes()
      await requirePermission('billing', 'manage')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Insufficient permissions', code: 'FORBIDDEN' },
      })
      expect(next).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Permission denied', {
        userId: 'user-123',
        resource: 'billing',
        action: 'manage',
      })
      consoleSpy.mockRestore()
    })

    it('should return 403 when hasPermission returns null', async () => {
      vi.mocked(auth.api.hasPermission).mockResolvedValueOnce(null as never)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { req, res, next } = createMockReqRes()
      await requirePermission('member', 'invite')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(403)
      expect(next).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Multiple Resources and Actions', () => {
    it('should pass correct resource and action for member invite', async () => {
      const { req, res, next } = createMockReqRes()
      await requirePermission('member', 'invite')(req, res, next)
      expect(auth.api.hasPermission).toHaveBeenCalledWith({
        headers: expect.anything(),
        body: { permission: { member: ['invite'] } },
      })
      expect(next).toHaveBeenCalled()
    })

    it('should pass correct resource and action for billing manage', async () => {
      const { req, res, next } = createMockReqRes()
      await requirePermission('billing', 'manage')(req, res, next)
      expect(auth.api.hasPermission).toHaveBeenCalledWith({
        headers: expect.anything(),
        body: { permission: { billing: ['manage'] } },
      })
      expect(next).toHaveBeenCalled()
    })

    it('should pass correct resource and action for organization delete', async () => {
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'delete')(req, res, next)
      expect(auth.api.hasPermission).toHaveBeenCalledWith({
        headers: expect.anything(),
        body: { permission: { organization: ['delete'] } },
      })
      expect(next).toHaveBeenCalled()
    })
  })

  describe('Error Handling', () => {
    it('should return 500 when hasPermission throws an error', async () => {
      vi.mocked(auth.api.hasPermission).mockRejectedValueOnce(new Error('Service unavailable'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'update')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
      expect(next).not.toHaveBeenCalled()
      expect(consoleSpy).toHaveBeenCalledWith('Permission middleware error', {
        error: 'Service unavailable',
        stack: expect.any(String),
      })
      consoleSpy.mockRestore()
    })

    it('should return 500 when getSession throws an error', async () => {
      vi.mocked(auth.api.getSession).mockRejectedValueOnce(new Error('Auth service down'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'update')(req, res, next)
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
      expect(next).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('Error Format Consistency', () => {
    it('should return consistent error format for all error responses', async () => {
      vi.mocked(auth.api.getSession).mockResolvedValueOnce(null as never)
      const { req, res, next } = createMockReqRes()
      await requirePermission('organization', 'update')(req, res, next)
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
