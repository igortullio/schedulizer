import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface RouteLayer {
  route?: {
    path?: string
    methods?: { post?: boolean; get?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
}

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
    },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(() => ({})),
}))

const { mockDbSelect, mockDbInsert, mockDbUpdate } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
  })),
  schema: {
    subscriptions: {
      organizationId: 'organization_id',
      stripeCustomerId: 'stripe_customer_id',
      stripeSubscriptionId: 'stripe_subscription_id',
    },
    members: { organizationId: 'organization_id' },
    services: { organizationId: 'organization_id' },
  },
}))

const {
  mockCreateCheckoutSession,
  mockCreatePortalSession,
  mockVerifyWebhookSignature,
  mockResolvePlanFromSubscription,
  mockStripe,
} = vi.hoisted(() => ({
  mockCreateCheckoutSession: vi.fn(),
  mockCreatePortalSession: vi.fn(),
  mockVerifyWebhookSignature: vi.fn(),
  mockResolvePlanFromSubscription: vi.fn(),
  mockStripe: {
    customers: { create: vi.fn(() => Promise.resolve({ id: 'cus_123' })) },
    subscriptions: { retrieve: vi.fn() },
  },
}))

vi.mock('@schedulizer/billing', () => ({
  createCheckoutSession: (...args: unknown[]) => mockCreateCheckoutSession(...args),
  createPortalSession: (...args: unknown[]) => mockCreatePortalSession(...args),
  verifyWebhookSignature: (...args: unknown[]) => mockVerifyWebhookSignature(...args),
  resolvePlanFromSubscription: (...args: unknown[]) => mockResolvePlanFromSubscription(...args),
  getStripeClient: vi.fn(() => mockStripe),
}))

vi.mock('@schedulizer/shared-types', () => ({
  getPlanLimits: vi.fn((planType: string) => {
    if (planType === 'essential') {
      return {
        maxMembers: 1,
        maxServices: 5,
        notifications: { email: true, whatsapp: false },
      }
    }
    return {
      maxMembers: 5,
      maxServices: Infinity,
      notifications: { email: true, whatsapp: true },
    }
  }),
}))

import { billingRoutes, webhookRouter } from '../billing.routes'

function createMockReqRes(body: unknown, headers: Record<string, string> = {}, query: Record<string, string> = {}) {
  const req = { body, headers, query } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

function findRouteHandler(router: unknown, method: 'post' | 'get', path?: string) {
  const routes = (router as { stack: RouteLayer[] }).stack
  const route = routes.find(r => {
    if (!r.route?.methods?.[method]) return false
    if (path && r.route.path !== path) return false
    return true
  })
  const stack = route?.route?.stack ?? []
  return stack[stack.length - 1]?.handle
}

function createSelectChain(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(data)),
      }),
    }),
  }
}

function createCountChain(value: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve([{ value }])),
    }),
  }
}

describe('Billing Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbSelect.mockReturnValue(createSelectChain([]))
    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue(Promise.resolve()),
    })
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve()),
      }),
    })
    mockResolvePlanFromSubscription.mockReturnValue(null)
  })

  describe('POST /billing/checkout', () => {
    it('should have POST checkout route registered', () => {
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      expect(handler).toBeDefined()
    })

    it('should return checkout session URL for valid request', async () => {
      mockCreateCheckoutSession.mockResolvedValue({
        success: true,
        data: { id: 'cs_123', url: 'https://checkout.stripe.com/cs_123' },
      })
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      const { req, res } = createMockReqRes({
        priceId: 'price_123',
        successUrl: 'https://app.schedulizer.me/success',
        cancelUrl: 'https://app.schedulizer.me/cancel',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { url: 'https://checkout.stripe.com/cs_123', sessionId: 'cs_123' },
        })
      }
    })

    it('should validate required fields (priceId)', async () => {
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      const { req, res } = createMockReqRes({
        priceId: '',
        successUrl: 'https://app.schedulizer.me/success',
        cancelUrl: 'https://app.schedulizer.me/cancel',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({ code: 'INVALID_REQUEST' }),
          }),
        )
      }
    })

    it('should return 401 for unauthenticated requests', async () => {
      const authModule = await import('../../lib/auth')
      vi.mocked(authModule.auth.api.getSession).mockResolvedValueOnce(null)
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      const { req, res } = createMockReqRes({
        priceId: 'price_123',
        successUrl: 'https://app.schedulizer.me/success',
        cancelUrl: 'https://app.schedulizer.me/cancel',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        })
      }
    })
  })

  describe('POST /billing/portal', () => {
    it('should have POST portal route registered', () => {
      const handler = findRouteHandler(billingRoutes, 'post', '/portal')
      expect(handler).toBeDefined()
    })

    it('should return portal URL for organizations with active subscription', async () => {
      mockDbSelect.mockReturnValue(createSelectChain([{ stripeCustomerId: 'cus_123' }]))
      mockCreatePortalSession.mockResolvedValue({
        success: true,
        data: { url: 'https://billing.stripe.com/session_123' },
      })
      const handler = findRouteHandler(billingRoutes, 'post', '/portal')
      const { req, res } = createMockReqRes({
        returnUrl: 'https://app.schedulizer.me/settings',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { url: 'https://billing.stripe.com/session_123' },
        })
      }
    })

    it('should return 404 for organizations without Stripe customer', async () => {
      const handler = findRouteHandler(billingRoutes, 'post', '/portal')
      const { req, res } = createMockReqRes({
        returnUrl: 'https://app.schedulizer.me/settings',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'No billing information found for this organization', code: 'NOT_FOUND' },
        })
      }
    })
  })

  describe('GET /billing/subscription', () => {
    it('should have GET subscription route registered', () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      expect(handler).toBeDefined()
    })

    it('should return subscription with usage and limits for professional plan', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_professional_monthly',
        status: 'active',
        plan: 'professional',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      }
      mockResolvePlanFromSubscription.mockReturnValue({
        type: 'professional',
        limits: { maxMembers: 5, maxServices: Infinity, notifications: { email: true, whatsapp: true } },
        stripePriceId: 'price_professional_monthly',
      })
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(3))
        .mockReturnValueOnce(createCountChain(8))
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            id: 'sub-uuid',
            status: 'active',
            plan: 'professional',
            usage: {
              members: { current: 3, limit: 5, canAdd: true },
              services: { current: 8, limit: null, canAdd: true },
            },
            limits: {
              maxMembers: 5,
              maxServices: null,
              notifications: { email: true, whatsapp: true },
            },
          }),
        })
      }
    })

    it('should return subscription with usage and limits for essential plan', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_essential_monthly',
        status: 'active',
        plan: 'essential',
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      }
      mockResolvePlanFromSubscription.mockReturnValue({
        type: 'essential',
        limits: { maxMembers: 1, maxServices: 5, notifications: { email: true, whatsapp: false } },
        stripePriceId: 'price_essential_monthly',
      })
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(1))
        .mockReturnValueOnce(createCountChain(5))
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            plan: 'essential',
            usage: {
              members: { current: 1, limit: 1, canAdd: false },
              services: { current: 5, limit: 5, canAdd: false },
            },
            limits: {
              maxMembers: 1,
              maxServices: 5,
              notifications: { email: true, whatsapp: false },
            },
          }),
        })
      }
    })

    it('should return subscription with trialing status as professional', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: null,
        status: 'trialing',
        plan: null,
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      }
      mockResolvePlanFromSubscription.mockReturnValue({
        type: 'professional',
        limits: { maxMembers: 5, maxServices: Infinity, notifications: { email: true, whatsapp: true } },
        stripePriceId: '',
      })
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(1))
        .mockReturnValueOnce(createCountChain(2))
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            plan: 'professional',
            usage: {
              members: { current: 1, limit: 5, canAdd: true },
              services: { current: 2, limit: null, canAdd: true },
            },
          }),
        })
      }
    })

    it('should return null for organizations without subscription', async () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ data: null })
      }
    })

    it('should fallback to essential when plan cannot be resolved', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        stripePriceId: 'price_unknown',
        status: 'active',
        plan: null,
        currentPeriodStart: new Date('2024-01-01'),
        currentPeriodEnd: new Date('2024-02-01'),
        cancelAtPeriodEnd: false,
      }
      mockResolvePlanFromSubscription.mockReturnValue(null)
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(1))
        .mockReturnValueOnce(createCountChain(3))
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: expect.objectContaining({
            plan: 'essential',
            usage: {
              members: { current: 1, limit: 1, canAdd: false },
              services: { current: 3, limit: 5, canAdd: true },
            },
            limits: {
              maxMembers: 1,
              maxServices: 5,
              notifications: { email: true, whatsapp: false },
            },
          }),
        })
      }
    })
  })

  describe('GET /billing/validate-downgrade', () => {
    it('should have GET validate-downgrade route registered', () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      expect(handler).toBeDefined()
    })

    it('should return canDowngrade true when usage is within limits', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        status: 'active',
        plan: 'professional',
      }
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(1))
        .mockReturnValueOnce(createCountChain(3))
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: {
            canDowngrade: true,
            currentUsage: { members: 1, services: 3 },
            targetLimits: { maxMembers: 1, maxServices: 5 },
          },
        })
      }
    })

    it('should return canDowngrade false when usage exceeds limits', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        status: 'active',
        plan: 'professional',
      }
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(3))
        .mockReturnValueOnce(createCountChain(8))
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: {
            canDowngrade: false,
            currentUsage: { members: 3, services: 8 },
            targetLimits: { maxMembers: 1, maxServices: 5 },
            exceeded: [
              { resource: 'members', current: 3, limit: 1 },
              { resource: 'services', current: 8, limit: 5 },
            ],
          },
        })
      }
    })

    it('should return canDowngrade false when only members exceed', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        stripeSubscriptionId: 'sub_123',
        status: 'active',
        plan: 'professional',
      }
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(3))
        .mockReturnValueOnce(createCountChain(4))
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: {
            canDowngrade: false,
            currentUsage: { members: 3, services: 4 },
            targetLimits: { maxMembers: 1, maxServices: 5 },
            exceeded: [{ resource: 'members', current: 3, limit: 1 }],
          },
        })
      }
    })

    it('should return 400 for invalid target plan', async () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'invalid' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Invalid target plan', code: 'INVALID_TARGET_PLAN' },
        })
      }
    })

    it('should return 400 for missing target plan', async () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, {})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Invalid target plan', code: 'INVALID_TARGET_PLAN' },
        })
      }
    })

    it('should return 403 for organizations without active subscription', async () => {
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'No active subscription', code: 'NO_ACTIVE_SUBSCRIPTION' },
        })
      }
    })

    it('should return 403 for organizations with canceled subscription', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        status: 'canceled',
      }
      mockDbSelect.mockReturnValueOnce(createSelectChain([subscriptionData]))
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(403)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'No active subscription', code: 'NO_ACTIVE_SUBSCRIPTION' },
        })
      }
    })

    it('should return 401 for unauthenticated requests', async () => {
      const authModule = await import('../../lib/auth')
      vi.mocked(authModule.auth.api.getSession).mockResolvedValueOnce(null)
      const handler = findRouteHandler(billingRoutes, 'get', '/validate-downgrade')
      const { req, res } = createMockReqRes({}, {}, { targetPlan: 'essential' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(401)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
        })
      }
    })
  })

  describe('POST /billing/webhook', () => {
    it('should have POST webhook route registered', () => {
      const routes = (webhookRouter as { stack: RouteLayer[] }).stack
      const webhookRoute = routes.find(r => r.route?.path === '/webhook' && r.route?.methods?.post)
      expect(webhookRoute).toBeDefined()
    })

    it('should return 400 for missing Stripe signature', async () => {
      const handler = findRouteHandler(webhookRouter, 'post', '/webhook')
      const { req, res } = createMockReqRes(Buffer.from('{}'), {})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Missing Stripe signature', code: 'MISSING_SIGNATURE' },
        })
      }
    })

    it('should return 400 for invalid signature', async () => {
      mockVerifyWebhookSignature.mockReturnValue({
        success: false,
        error: { type: 'invalid_request', message: 'Signature verification failed' },
      })
      const handler = findRouteHandler(webhookRouter, 'post', '/webhook')
      const { req, res } = createMockReqRes(Buffer.from('{}'), { 'stripe-signature': 'invalid_sig' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Invalid signature', code: 'INVALID_SIGNATURE' },
        })
      }
    })

    it('should handle checkout.session.completed event', async () => {
      mockVerifyWebhookSignature.mockReturnValue({
        success: true,
        data: {
          id: 'evt_123',
          type: 'checkout.session.completed',
          data: {
            object: {
              id: 'cs_123',
              subscription: 'sub_123',
              metadata: { organizationId: 'org-123' },
            },
          },
        },
      })
      mockStripe.subscriptions.retrieve.mockResolvedValue({
        id: 'sub_123',
        status: 'active',
        cancel_at_period_end: false,
        items: {
          data: [
            {
              price: { id: 'price_123', nickname: 'Professional' },
              current_period_start: 1704067200,
              current_period_end: 1706745600,
            },
          ],
        },
      })
      const handler = findRouteHandler(webhookRouter, 'post', '/webhook')
      const { req, res } = createMockReqRes(Buffer.from('{}'), { 'stripe-signature': 'valid_sig' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ received: true })
      }
    })

    it('should handle customer.subscription.updated event', async () => {
      mockVerifyWebhookSignature.mockReturnValue({
        success: true,
        data: {
          id: 'evt_124',
          type: 'customer.subscription.updated',
          data: {
            object: {
              id: 'sub_123',
              status: 'active',
              metadata: { organizationId: 'org-123' },
              cancel_at_period_end: false,
              items: {
                data: [
                  {
                    price: { id: 'price_123', nickname: 'Professional' },
                    current_period_start: 1704067200,
                    current_period_end: 1706745600,
                  },
                ],
              },
            },
          },
        },
      })
      const handler = findRouteHandler(webhookRouter, 'post', '/webhook')
      const { req, res } = createMockReqRes(Buffer.from('{}'), { 'stripe-signature': 'valid_sig' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ received: true })
      }
    })

    it('should handle customer.subscription.deleted event', async () => {
      mockDbSelect.mockReturnValue(createSelectChain([{ organizationId: 'org-123' }]))
      mockVerifyWebhookSignature.mockReturnValue({
        success: true,
        data: {
          id: 'evt_125',
          type: 'customer.subscription.deleted',
          data: {
            object: {
              id: 'sub_123',
              status: 'canceled',
            },
          },
        },
      })
      const handler = findRouteHandler(webhookRouter, 'post', '/webhook')
      const { req, res } = createMockReqRes(Buffer.from('{}'), { 'stripe-signature': 'valid_sig' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ received: true })
      }
    })
  })

  describe('Multi-tenancy', () => {
    it('should filter subscription by organizationId', async () => {
      const subscriptionData = {
        id: 'sub-uuid',
        organizationId: 'org-123',
        stripeCustomerId: 'cus_123',
        status: 'active',
        stripePriceId: 'price_essential_monthly',
      }
      mockResolvePlanFromSubscription.mockReturnValue({
        type: 'essential',
        limits: { maxMembers: 1, maxServices: 5, notifications: { email: true, whatsapp: false } },
        stripePriceId: 'price_essential_monthly',
      })
      mockDbSelect
        .mockReturnValueOnce(createSelectChain([subscriptionData]))
        .mockReturnValueOnce(createCountChain(1))
        .mockReturnValueOnce(createCountChain(2))
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(mockDbSelect).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(200)
      }
    })

    it('should return error if no active organization', async () => {
      const authModule = await import('../../lib/auth')
      vi.mocked(authModule.auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        session: { activeOrganizationId: null },
      } as never)
      const handler = findRouteHandler(billingRoutes, 'get', '/subscription')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' },
        })
      }
    })
  })

  describe('Error Format Consistency', () => {
    it('should return consistent error format on validation failure', async () => {
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      const { req, res } = createMockReqRes({ priceId: '' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            error: expect.objectContaining({
              message: expect.any(String),
              code: expect.any(String),
            }),
          }),
        )
      }
    })

    it('should return consistent error format on internal error', async () => {
      mockCreateCheckoutSession.mockRejectedValue(new Error('Internal error'))
      const handler = findRouteHandler(billingRoutes, 'post', '/checkout')
      const { req, res } = createMockReqRes({
        priceId: 'price_123',
        successUrl: 'https://app.schedulizer.me/success',
        cancelUrl: 'https://app.schedulizer.me/cancel',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(500)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
        })
      }
    })
  })
})
