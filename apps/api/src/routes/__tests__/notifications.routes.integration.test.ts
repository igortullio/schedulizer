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

const { mockSendAppointmentReminder } = vi.hoisted(() => ({
  mockSendAppointmentReminder: vi.fn(() => Promise.resolve()),
}))

vi.mock('@schedulizer/email', () => ({
  EmailService: class MockEmailService {
    sendAppointmentReminder = mockSendAppointmentReminder
  },
  extractLocale: vi.fn((header: string | null) => {
    if (!header) return 'pt-BR'
    if (header.toLowerCase().startsWith('en')) return 'en'
    return 'pt-BR'
  }),
  DEFAULT_LOCALE: 'pt-BR',
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

function createMockAppointment(overrides: Record<string, unknown> = {}) {
  const futureDate = new Date(Date.now() + 24 * 3600 * 1000)
  return {
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
    language: 'pt-BR',
    ...overrides,
  }
}

function createMockReqRes() {
  const req = { body: {}, headers: {}, params: {} } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  return { req, res }
}

function mockSelectChain(result: unknown, hasLimit = false) {
  if (hasLimit) {
    return {
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue(Promise.resolve(result)),
        }),
      }),
    }
  }
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve(result)),
    }),
  }
}

function mockUpdateChain() {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve()),
    }),
  }
}

function setupSingleAppointmentMocks(
  appointment: ReturnType<typeof createMockAppointment>,
  organization: typeof mockOrganization | null = mockOrganization,
  service: typeof mockService | null = mockService,
) {
  mockDbSelect
    .mockReturnValueOnce(mockSelectChain([appointment]))
    .mockReturnValueOnce(mockSelectChain(organization ? [organization] : [], true))
    .mockReturnValueOnce(mockSelectChain(service ? [service] : [], true))
  mockDbUpdate.mockReturnValue(mockUpdateChain())
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
    it('should have route registered', () => {
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      expect(handler).toBeDefined()
    })

    it('should process eligible appointments and return counts', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 1, failed: 0 } })
      expect(mockSendAppointmentReminder).toHaveBeenCalledTimes(1)
    })

    it('should call sendAppointmentReminder with correct parameters', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(mockSendAppointmentReminder).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'john@example.com',
          locale: 'pt-BR',
          customerName: 'John',
          serviceName: 'Haircut',
          organizationName: 'Test Business',
          cancelUrl: expect.stringContaining('http://localhost:4200/booking/test-business/manage/token-123'),
          rescheduleUrl: expect.stringContaining('http://localhost:4200/booking/test-business/manage/token-123'),
        }),
      )
    })

    it('should update reminderSentAt after successful send', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(mockDbUpdate).toHaveBeenCalledTimes(1)
    })

    it('should return zero counts when no eligible appointments', async () => {
      mockDbSelect.mockReturnValueOnce(mockSelectChain([]))
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 0, failed: 0 } })
      expect(mockSendAppointmentReminder).not.toHaveBeenCalled()
    })

    it('should count failures when email send fails', async () => {
      const appointment = createMockAppointment({ status: 'confirmed' })
      setupSingleAppointmentMocks(appointment)
      mockSendAppointmentReminder.mockRejectedValueOnce(new Error('Email send failed'))
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 0, failed: 1 } })
    })

    it('should not update reminderSentAt when email send fails', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment)
      mockSendAppointmentReminder.mockRejectedValueOnce(new Error('Email send failed'))
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(mockDbUpdate).not.toHaveBeenCalled()
    })

    it('should increment failed count when organization is not found', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment, null, mockService)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 0, failed: 1 } })
      expect(mockSendAppointmentReminder).not.toHaveBeenCalled()
    })

    it('should increment failed count when service is not found', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment, mockOrganization, null)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 0, failed: 1 } })
      expect(mockSendAppointmentReminder).not.toHaveBeenCalled()
    })

    it('should handle batch of multiple appointments with mixed success and failure', async () => {
      const appointment1 = createMockAppointment({ id: 'apt-1', managementToken: 'token-1' })
      const appointment2 = createMockAppointment({ id: 'apt-2', managementToken: 'token-2' })
      const appointment3 = createMockAppointment({ id: 'apt-3', managementToken: 'token-3' })
      mockDbSelect
        .mockReturnValueOnce(mockSelectChain([appointment1, appointment2, appointment3]))
        .mockReturnValueOnce(mockSelectChain([mockOrganization], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
        .mockReturnValueOnce(mockSelectChain([mockOrganization], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
        .mockReturnValueOnce(mockSelectChain([mockOrganization], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
      mockDbUpdate.mockReturnValue(mockUpdateChain())
      mockSendAppointmentReminder
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('Email send failed'))
        .mockResolvedValueOnce(undefined)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 2, failed: 1 } })
      expect(mockSendAppointmentReminder).toHaveBeenCalledTimes(3)
    })

    it('should return 500 on unexpected database error', async () => {
      mockDbSelect.mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(new Error('Database connection failed')),
        }),
      })
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
      })
    })

    it('should continue processing when one appointment fails but others succeed', async () => {
      const appointment1 = createMockAppointment({ id: 'apt-1', managementToken: 'token-1' })
      const appointment2 = createMockAppointment({
        id: 'apt-2',
        organizationId: 'org-missing',
        managementToken: 'token-2',
      })
      const appointment3 = createMockAppointment({ id: 'apt-3', managementToken: 'token-3' })
      mockDbSelect
        .mockReturnValueOnce(mockSelectChain([appointment1, appointment2, appointment3]))
        .mockReturnValueOnce(mockSelectChain([mockOrganization], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
        .mockReturnValueOnce(mockSelectChain([], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
        .mockReturnValueOnce(mockSelectChain([mockOrganization], true))
        .mockReturnValueOnce(mockSelectChain([mockService], true))
      mockDbUpdate.mockReturnValue(mockUpdateChain())
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: { sent: 2, failed: 1 } })
    })

    it('should send separate appointmentDate and appointmentTime', async () => {
      const appointment = createMockAppointment()
      setupSingleAppointmentMocks(appointment)
      const handler = findRouteHandler(notificationsRoutes, 'post', '/send-reminders')
      const { req, res } = createMockReqRes()
      await handler!(req, res, vi.fn())
      const reminderCall = mockSendAppointmentReminder.mock.calls[0] as unknown[]
      const params = reminderCall[0] as { appointmentDate: string; appointmentTime: string }
      expect(params.appointmentDate).toMatch(/^\d{2}\/\d{2}\/\d{4}$/)
      expect(params.appointmentTime).toMatch(/^\d{2}:\d{2}$/)
    })
  })
})
