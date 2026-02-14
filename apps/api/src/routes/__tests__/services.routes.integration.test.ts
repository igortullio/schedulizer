import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface RouteLayer {
  route?: {
    path?: string
    methods?: { post?: boolean; get?: boolean; put?: boolean; delete?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
  handle?: { name?: string }
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

const { mockDbSelect, mockDbInsert, mockDbUpdate, mockDbDelete } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockDbDelete: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    delete: mockDbDelete,
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

import { servicesRoutes } from '../services.routes'

function createMockReqRes(
  body: unknown,
  headers: Record<string, string> = {},
  params: Record<string, string> = {},
  query: Record<string, string> = {},
) {
  const req = { body, headers, params, query } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

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

describe('Services Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockDbSelect.mockReturnValue({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(Promise.resolve([])),
        }),
      }),
    })
    mockDbInsert.mockReturnValue({
      values: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
      }),
    })
    mockDbUpdate.mockReturnValue({
      set: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
        }),
      }),
    })
    mockDbDelete.mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve()),
    })
  })

  describe('POST /services', () => {
    it('should have POST route registered', () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      expect(handler).toBeDefined()
    })

    it('should create service with valid input and return 201', async () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({
        name: 'Haircut',
        description: 'A nice haircut',
        duration: 30,
        price: '50.00',
      })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(201)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              name: 'Haircut',
              price: '50.00',
            }),
          }),
        )
      }
    })

    it('should return 400 for invalid input (empty name)', async () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({
        name: '',
        duration: 30,
        price: '50.00',
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

    it('should return 400 for invalid duration (< 5)', async () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({
        name: 'Test',
        duration: 3,
        price: '50.00',
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

    it('should return 400 for invalid price format', async () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({
        name: 'Test',
        duration: 30,
        price: '50',
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
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({
        name: 'Test',
        duration: 30,
        price: '50.00',
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

  describe('GET /services', () => {
    it('should have GET route registered', () => {
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      expect(handler).toBeDefined()
    })

    it('should return 200 with list of services', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({}, {}, {}, {})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.arrayContaining([expect.objectContaining({ name: 'Haircut', price: '50.00' })]),
          }),
        )
      }
    })

    it('should return empty array when no services exist', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve([])),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({}, {}, {}, {})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({ data: [] })
      }
    })

    it('should filter by active=true', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({}, {}, {}, { active: 'true' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(mockDbSelect).toHaveBeenCalled()
      }
    })

    it('should filter by active=false', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve([])),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({}, {}, {}, { active: 'false' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(mockDbSelect).toHaveBeenCalled()
      }
    })
  })

  describe('GET /services/:serviceId', () => {
    it('should have GET route registered', () => {
      const handler = findRouteHandler(servicesRoutes, 'get', '/:serviceId')
      expect(handler).toBeDefined()
    })

    it('should return 200 with service data', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/:serviceId')
      const { req, res } = createMockReqRes({}, {}, { serviceId: 'service-123' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ name: 'Haircut', price: '50.00' }),
          }),
        )
      }
    })

    it('should return 404 when service does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/:serviceId')
      const { req, res } = createMockReqRes({}, {}, { serviceId: 'nonexistent' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Service not found', code: 'NOT_FOUND' },
        })
      }
    })
  })

  describe('PUT /services/:serviceId', () => {
    it('should have PUT route registered', () => {
      const handler = findRouteHandler(servicesRoutes, 'put', '/:serviceId')
      expect(handler).toBeDefined()
    })

    it('should update service with partial data', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
          }),
        }),
      })
      const updatedService = { ...mockServiceData, name: 'Premium Haircut' }
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(Promise.resolve([updatedService])),
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'put', '/:serviceId')
      const { req, res } = createMockReqRes({ name: 'Premium Haircut' }, {}, { serviceId: 'service-123' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ name: 'Premium Haircut' }),
          }),
        )
      }
    })

    it('should return 404 when service does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'put', '/:serviceId')
      const { req, res } = createMockReqRes({ name: 'Test' }, {}, { serviceId: 'nonexistent' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Service not found', code: 'NOT_FOUND' },
        })
      }
    })
  })

  describe('DELETE /services/:serviceId', () => {
    it('should have DELETE route registered', () => {
      const handler = findRouteHandler(servicesRoutes, 'delete', '/:serviceId')
      expect(handler).toBeDefined()
    })

    it('should return 204 when service has no future appointments', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([])),
            }),
          }),
        })
      const handler = findRouteHandler(servicesRoutes, 'delete', '/:serviceId')
      const { req, res } = createMockReqRes({}, {}, { serviceId: 'service-123' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(204)
        expect(res.send).toHaveBeenCalled()
      }
    })

    it('should return 404 when service does not exist', async () => {
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue(Promise.resolve([])),
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'delete', '/:serviceId')
      const { req, res } = createMockReqRes({}, {}, { serviceId: 'nonexistent' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(404)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Service not found', code: 'NOT_FOUND' },
        })
      }
    })

    it('should return 422 when service has future appointments', async () => {
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockServiceData])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([{ id: 'apt-123' }])),
            }),
          }),
        })
      const handler = findRouteHandler(servicesRoutes, 'delete', '/:serviceId')
      const { req, res } = createMockReqRes({}, {}, { serviceId: 'service-123' })
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(422)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'Service has future appointments', code: 'HAS_FUTURE_APPOINTMENTS' },
        })
      }
    })
  })

  describe('Multi-tenancy', () => {
    it('should return 401 when no session', async () => {
      const authModule = await import('../../lib/auth')
      vi.mocked(authModule.auth.api.getSession).mockResolvedValueOnce(null)
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(401)
      }
    })

    it('should return 400 when no active organization', async () => {
      const authModule = await import('../../lib/auth')
      vi.mocked(authModule.auth.api.getSession).mockResolvedValueOnce({
        user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
        session: { activeOrganizationId: null },
      } as never)
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({})
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(400)
        expect(res.json).toHaveBeenCalledWith({
          error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
        })
      }
    })
  })

  describe('Error Format Consistency', () => {
    it('should return consistent error format on validation failure', async () => {
      const handler = findRouteHandler(servicesRoutes, 'post', '/')
      const { req, res } = createMockReqRes({ name: '' })
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
      mockDbSelect.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockImplementation(() => {
            throw new Error('Database error')
          }),
        }),
      })
      const handler = findRouteHandler(servicesRoutes, 'get', '/')
      const { req, res } = createMockReqRes({}, {}, {}, {})
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
