import type { Request, Response } from 'express'
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

const { mockDbSelect, mockDbInsert } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: vi.fn(),
    delete: vi.fn(),
  })),
  schema: {
    services: {
      id: 'id',
      organizationId: 'organization_id',
      name: 'name',
      description: 'description',
      durationMinutes: 'duration_minutes',
      price: 'price',
      active: 'active',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    appointments: {
      id: 'id',
      serviceId: 'service_id',
      startDatetime: 'start_datetime',
      status: 'status',
    },
  },
}))

vi.mock('../../middlewares/require-subscription.middleware', () => ({
  requireSubscription: vi.fn((_req: Request, _res: Response, next: () => void) => next()),
}))

interface RouteLayer {
  route?: {
    path?: string
    methods?: { post?: boolean; get?: boolean; put?: boolean; delete?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
  handle?: { name?: string }
}

import { servicesRoutes } from '../services.routes'

function findRouteHandler(router: unknown, method: 'post' | 'get' | 'put' | 'delete', path?: string) {
  const routes = (router as { stack: RouteLayer[] }).stack.filter(r => !r.handle?.name?.includes('requireSubscription'))
  const route = routes.find(r => {
    if (!r.route?.methods?.[method]) return false
    if (path && r.route.path !== path) return false
    return true
  })
  const stack = route?.route?.stack ?? []
  return stack[stack.length - 1]?.handle
}

const mockServiceData = {
  id: 'service-123',
  organizationId: 'org-123',
  name: 'Haircut',
  description: 'A nice haircut',
  durationMinutes: 30,
  price: 5000,
  active: true,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
}

function createMockReqRes(body: unknown, subscription?: Request['subscription']) {
  const req = {
    body,
    headers: {},
    params: {},
    query: {},
    subscription,
  } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

function createEssentialSubscription() {
  return {
    id: 'sub-123',
    status: 'active',
    plan: {
      type: 'essential' as const,
      limits: { maxMembers: 1, maxServices: 5, notifications: { email: true, whatsapp: false } },
      stripePriceId: 'price_essential_monthly',
    },
    organizationId: 'org-123',
    stripeSubscriptionId: 'stripe_sub_123',
  }
}

function createProfessionalSubscription() {
  return {
    id: 'sub-123',
    status: 'active',
    plan: {
      type: 'professional' as const,
      limits: { maxMembers: 5, maxServices: Infinity, notifications: { email: true, whatsapp: true } },
      stripePriceId: 'price_professional_monthly',
    },
    organizationId: 'org-123',
    stripeSubscriptionId: 'stripe_sub_123',
  }
}

function setupCountQuery(serviceCount: number) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve([{ value: serviceCount }])),
    }),
  }
}

function setupInsertQuery() {
  return {
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
    }),
  }
}

describe('Service Creation Guard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should allow creation when Essential plan has fewer than 5 services', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(3))
    mockDbInsert.mockReturnValueOnce(setupInsertQuery())
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(201)
    }
  })

  it('should block creation when Essential plan has 5 services (limit reached)', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(5))
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: {
          message: 'Plan limit exceeded for services',
          code: 'PLAN_LIMIT_EXCEEDED',
          resource: 'services',
          current: 5,
          limit: 5,
          upgradeRequired: true,
        },
      })
    }
  })

  it('should block creation when Essential plan has more than 5 services', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(7))
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({
        error: expect.objectContaining({
          code: 'PLAN_LIMIT_EXCEEDED',
          resource: 'services',
          current: 7,
          limit: 5,
          upgradeRequired: true,
        }),
      })
    }
  })

  it('should always allow creation for Professional plan (unlimited services)', async () => {
    mockDbInsert.mockReturnValueOnce(setupInsertQuery())
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes(
      { name: 'Test', duration: 30, price: '50.00' },
      createProfessionalSubscription(),
    )
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(201)
      expect(mockDbSelect).not.toHaveBeenCalled()
    }
  })

  it('should allow creation when subscription has no plan limits (skip guard)', async () => {
    mockDbInsert.mockReturnValueOnce(setupInsertQuery())
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, undefined)
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(201)
    }
  })

  it('should include all required fields in PLAN_LIMIT_EXCEEDED response', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(5))
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      const jsonCall = vi.mocked(res.json).mock.calls[0][0]
      expect(jsonCall.error).toHaveProperty('code', 'PLAN_LIMIT_EXCEEDED')
      expect(jsonCall.error).toHaveProperty('resource', 'services')
      expect(jsonCall.error).toHaveProperty('current')
      expect(jsonCall.error).toHaveProperty('limit')
      expect(jsonCall.error).toHaveProperty('upgradeRequired', true)
    }
  })

  it('should log when plan limit blocks creation', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(5))
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plan limit enforcement triggered',
        expect.objectContaining({
          organizationId: 'org-123',
          resource: 'services',
          action: 'blocked',
        }),
      )
    }
    consoleSpy.mockRestore()
  })

  it('should allow creation at exactly 4 services for Essential plan (under limit)', async () => {
    mockDbSelect.mockReturnValueOnce(setupCountQuery(4))
    mockDbInsert.mockReturnValueOnce(setupInsertQuery())
    const handler = findRouteHandler(servicesRoutes, 'post', '/')
    const { req, res } = createMockReqRes({ name: 'Test', duration: 30, price: '50.00' }, createEssentialSubscription())
    if (handler) {
      await handler(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(201)
    }
  })
})
