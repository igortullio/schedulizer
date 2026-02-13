import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

interface RouteLayer {
  route?: {
    path?: string
    methods?: { post?: boolean; get?: boolean }
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
    cronApiKey: 'test-cron-api-key-1234',
  },
}))

const { mockSendReminder } = vi.hoisted(() => ({
  mockSendReminder: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../lib/email', () => ({
  sendReminder: mockSendReminder,
}))

vi.mock('../../middlewares/require-api-key.middleware', () => ({
  requireApiKey: vi.fn((_req: Request, _res: Response, next: () => void) => next()),
}))

const { mockDbSelect, mockDbUpdate } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbUpdate: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    update: mockDbUpdate,
  })),
  schema: {
    appointments: {
      id: 'id',
      organizationId: 'organization_id',
      serviceId: 'service_id',
      startDatetime: 'start_datetime',
      status: 'status',
      customerName: 'customer_name',
      customerEmail: 'customer_email',
      managementToken: 'management_token',
      reminderSentAt: 'reminder_sent_at',
    },
    organizations: {
      id: 'id',
      name: 'name',
      slug: 'slug',
      timezone: 'timezone',
    },
    services: {
      id: 'id',
      name: 'name',
    },
  },
}))

import { notificationsRoutes } from '../notifications.routes'

const mockOrganization = {
  id: 'org-123',
  name: 'Test Business',
  slug: 'test-business',
  timezone: 'America/Sao_Paulo',
}

const mockService = { name: 'Haircut' }

function createMockReqRes(
  body: unknown = {},
  headers: Record<string, string> = {},
  params: Record<string, string> = {},
) {
  const req = { body, headers, params } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

function findRouteHandler(router: unknown, method: 'post' | 'get', path?: string) {
  const routes = (router as { stack: RouteLayer[] }).stack.filter(r => !r.handle?.name?.includes('requireApiKey'))
  const route = routes.find(r => {
    if (!r.route?.methods?.[method]) return false
    if (path && r.route.path !== path) return false
    return true
  })
  const stack = route?.route?.stack ?? []
  return stack[stack.length - 1]?.handle
}

describe('Notifications Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('POST /send-reminders', () => {
    it('should process eligible appointments and return counts', async () => {
      const futureDate = new Date(Date.now() + 24 * 3600 * 1000)
      const eligibleAppointment = {
        id: 'apt-123',
        organizationId: 'org-123',
        serviceId: 'service-123',
        startDatetime: futureDate,
        status: 'pending',
        customerName: 'John',
        customerEmail: 'john@example.com',
        customerPhone: '11999999999',
        managementToken: 'token-123',
        reminderSentAt: null,
      }
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(Promise.resolve([eligibleAppointment])),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockOrganization])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockService])),
            }),
          }),
        })
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve()),
        }),
      })
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { sent: 1, failed: 0 },
        })
        expect(mockSendReminder).toHaveBeenCalledTimes(1)
      }
    })

    it('should return zero counts when no eligible appointments', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue(Promise.resolve([])),
        }),
      })
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { sent: 0, failed: 0 },
        })
      }
    })

    it('should count failures when email send fails', async () => {
      const futureDate = new Date(Date.now() + 24 * 3600 * 1000)
      const eligibleAppointment = {
        id: 'apt-123',
        organizationId: 'org-123',
        serviceId: 'service-123',
        startDatetime: futureDate,
        status: 'confirmed',
        customerName: 'John',
        customerEmail: 'john@example.com',
        customerPhone: '11999999999',
        managementToken: 'token-123',
        reminderSentAt: null,
      }
      mockDbSelect
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue(Promise.resolve([eligibleAppointment])),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockOrganization])),
            }),
          }),
        })
        .mockReturnValueOnce({
          from: vi.fn().mockReturnValue({
            where: vi.fn().mockReturnValue({
              limit: vi.fn().mockReturnValue(Promise.resolve([mockService])),
            }),
          }),
        })
      mockSendReminder.mockRejectedValueOnce(new Error('Email send failed'))
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      if (handler) {
        await handler(req, res, vi.fn())
        expect(res.status).toHaveBeenCalledWith(200)
        expect(res.json).toHaveBeenCalledWith({
          data: { sent: 0, failed: 1 },
        })
      }
    })

    it('should have route registered', () => {
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      expect(handler).toBeDefined()
    })
  })
})
