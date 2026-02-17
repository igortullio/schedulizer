import express from 'express'
import request from 'supertest'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('date-fns-tz', () => ({
  formatInTimeZone: vi.fn(() => '15/03/2025 09:00'),
}))

vi.mock('../../lib/email', () => ({
  sendBookingConfirmation: vi.fn(() => Promise.resolve()),
  sendBookingCancellation: vi.fn(() => Promise.resolve()),
  sendBookingReschedule: vi.fn(() => Promise.resolve()),
  sendOwnerNewBookingNotification: vi.fn(() => Promise.resolve()),
  sendOwnerCancellationNotification: vi.fn(() => Promise.resolve()),
  sendOwnerRescheduleNotification: vi.fn(() => Promise.resolve()),
}))

vi.mock('../../lib/slot-calculator', () => ({
  calculateAvailableSlots: vi.fn(() =>
    Promise.resolve([{ startTime: '2025-03-15T12:00:00Z', endTime: '2025-03-15T12:30:00.000Z' }]),
  ),
}))

const { mockDbSelect, mockDbInsert, mockDbUpdate, mockDbTransaction } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbInsert: vi.fn(),
  mockDbUpdate: vi.fn(),
  mockDbTransaction: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    insert: mockDbInsert,
    update: mockDbUpdate,
    transaction: mockDbTransaction,
  })),
  schema: {
    organizations: { id: 'id', name: 'name', slug: 'slug', timezone: 'timezone' },
    services: {
      id: 'id',
      organizationId: 'organization_id',
      name: 'name',
      description: 'description',
      durationMinutes: 'duration_minutes',
      price: 'price',
      active: 'active',
    },
    appointments: {
      id: 'id',
      organizationId: 'organization_id',
      serviceId: 'service_id',
      startDatetime: 'start_datetime',
      endDatetime: 'end_datetime',
      status: 'status',
      customerName: 'customer_name',
      customerEmail: 'customer_email',
      customerPhone: 'customer_phone',
      managementToken: 'management_token',
      reminderSentAt: 'reminder_sent_at',
    },
    members: { organizationId: 'organization_id', userId: 'user_id', role: 'role' },
    users: { id: 'id', email: 'email' },
  },
}))

import { bookingRoutes } from '../booking.routes'

const app = express()
app.use(express.json())
app.use('/booking', bookingRoutes)

const ORG_ID = '550e8400-e29b-41d4-a716-446655440000'
const SERVICE_ID = '660e8400-e29b-41d4-a716-446655440001'
const APPOINTMENT_ID = '770e8400-e29b-41d4-a716-446655440002'

const mockOrganization = {
  id: ORG_ID,
  name: 'Test Business',
  slug: 'test-business',
  timezone: 'America/Sao_Paulo',
  createdAt: new Date(),
  logo: null,
  metadata: null,
}

const mockService = {
  id: SERVICE_ID,
  organizationId: ORG_ID,
  name: 'Haircut',
  description: 'A nice haircut',
  durationMinutes: 30,
  price: 5000,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const futureDate = new Date(Date.now() + 86400000)

const mockAppointment = {
  id: APPOINTMENT_ID,
  organizationId: ORG_ID,
  serviceId: SERVICE_ID,
  startDatetime: futureDate,
  endDatetime: new Date(futureDate.getTime() + 1800000),
  status: 'pending' as const,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  managementToken: 'token-abc-123',
  reminderSentAt: null,
  notes: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

function selectWithLimit(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(data)),
      }),
    }),
  }
}

function selectNoLimit(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve(data)),
    }),
  }
}

describe('Booking Routes Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-01T00:00:00Z'))
    vi.clearAllMocks()
    mockDbSelect.mockReset()
    mockDbInsert.mockReset()
    mockDbUpdate.mockReset()
    mockDbTransaction.mockReset()
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) =>
      cb({ select: mockDbSelect, insert: mockDbInsert, update: mockDbUpdate }),
    )
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('GET /booking/:slug', () => {
    it('should return organization info and active services', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([mockOrganization])).mockReturnValueOnce(
        selectNoLimit([
          {
            id: mockService.id,
            name: mockService.name,
            description: mockService.description,
            durationMinutes: mockService.durationMinutes,
            price: mockService.price,
          },
        ]),
      )
      const res = await request(app).get('/booking/test-business')
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(
        expect.objectContaining({
          organizationName: 'Test Business',
          slug: 'test-business',
        }),
      )
    })

    it('should return 404 when organization not found', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([]))
      const res = await request(app).get('/booking/nonexistent')
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('GET /booking/:slug/services/:serviceId/slots', () => {
    it('should return available slots for a valid date', async () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const dateStr = nextWeek.toISOString().split('T')[0]
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockService]))
      const res = await request(app).get(`/booking/test-business/services/service-123/slots?date=${dateStr}`)
      expect(res.status).toBe(200)
      expect(res.body.data.slots).toEqual(expect.any(Array))
    })

    it('should return 400 when date param is missing', async () => {
      const res = await request(app).get('/booking/test-business/services/service-123/slots')
      expect(res.status).toBe(400)
    })

    it('should return 400 for past date', async () => {
      const res = await request(app).get('/booking/test-business/services/service-123/slots?date=2020-01-01')
      expect(res.status).toBe(400)
    })

    it('should return 404 when organization not found', async () => {
      const nextWeek = new Date()
      nextWeek.setDate(nextWeek.getDate() + 7)
      const dateStr = nextWeek.toISOString().split('T')[0]
      mockDbSelect.mockReturnValueOnce(selectWithLimit([]))
      const res = await request(app).get(`/booking/nonexistent/services/service-123/slots?date=${dateStr}`)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /booking/:slug/appointments', () => {
    it('should create appointment with valid input', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockService]))
        .mockReturnValueOnce(selectWithLimit([]))
        .mockReturnValueOnce(selectWithLimit([{ userId: 'user-1' }]))
        .mockReturnValueOnce(selectWithLimit([{ email: 'owner@example.com' }]))
      mockDbInsert.mockReturnValue({
        values: vi.fn().mockReturnValue({
          returning: vi.fn().mockReturnValue(Promise.resolve([mockAppointment])),
        }),
      })
      const res = await request(app).post('/booking/test-business/appointments').send({
        serviceId: SERVICE_ID,
        startTime: '2025-03-15T12:00:00Z',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '11999999999',
      })
      expect(res.status).toBe(201)
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: APPOINTMENT_ID,
          status: 'pending',
          managementToken: 'token-abc-123',
        }),
      )
    })

    it('should return 400 for invalid input', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([mockOrganization]))
      const res = await request(app)
        .post('/booking/test-business/appointments')
        .send({ serviceId: 'not-a-uuid', startTime: 'invalid' })
      expect(res.status).toBe(400)
    })

    it('should return 409 when slot is no longer available', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockService]))
        .mockReturnValueOnce(selectWithLimit([{ id: 'existing-apt' }]))
      const res = await request(app).post('/booking/test-business/appointments').send({
        serviceId: SERVICE_ID,
        startTime: '2025-03-15T12:00:00Z',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        customerPhone: '11999999999',
      })
      expect(res.status).toBe(409)
    })
  })

  describe('GET /booking/:slug/manage/:token', () => {
    it('should return appointment details', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockAppointment]))
        .mockReturnValueOnce(selectWithLimit([{ name: 'Haircut' }]))
      const res = await request(app).get('/booking/test-business/manage/token-abc-123')
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(
        expect.objectContaining({
          id: APPOINTMENT_ID,
          serviceName: 'Haircut',
          customerName: 'John Doe',
        }),
      )
    })

    it('should return 404 when appointment not found', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([mockOrganization])).mockReturnValueOnce(selectWithLimit([]))
      const res = await request(app).get('/booking/test-business/manage/invalid-token')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /booking/:slug/manage/:token/cancel', () => {
    it('should cancel a future appointment', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockAppointment]))
        .mockReturnValueOnce(selectWithLimit([{ name: 'Haircut' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: 'user-1' }]))
        .mockReturnValueOnce(selectWithLimit([{ email: 'owner@example.com' }]))
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(Promise.resolve([{ ...mockAppointment, status: 'cancelled' }])),
          }),
        }),
      })
      const res = await request(app).post('/booking/test-business/manage/token-abc-123/cancel')
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(expect.objectContaining({ status: 'cancelled' }))
    })

    it('should return 422 for already cancelled appointment', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([{ ...mockAppointment, status: 'cancelled' }]))
      const res = await request(app).post('/booking/test-business/manage/token-abc-123/cancel')
      expect(res.status).toBe(422)
    })

    it('should return 422 for past appointment', async () => {
      const pastAppointment = { ...mockAppointment, startDatetime: new Date('2020-01-01T12:00:00.000Z') }
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([pastAppointment]))
      const res = await request(app).post('/booking/test-business/manage/token-abc-123/cancel')
      expect(res.status).toBe(422)
    })

    it('should return 422 for completed appointment', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([{ ...mockAppointment, status: 'completed' }]))
      const res = await request(app).post('/booking/test-business/manage/token-abc-123/cancel')
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('NOT_CANCELLABLE')
    })
  })

  describe('POST /booking/:slug/manage/:token/reschedule', () => {
    it('should reschedule a future appointment', async () => {
      const newStart = new Date(Date.now() + 172800000)
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockAppointment]))
        .mockReturnValueOnce(selectWithLimit([mockService]))
        .mockReturnValueOnce(selectWithLimit([]))
        .mockReturnValueOnce(selectWithLimit([{ userId: 'user-1' }]))
        .mockReturnValueOnce(selectWithLimit([{ email: 'owner@example.com' }]))
      mockDbUpdate.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            returning: vi.fn().mockReturnValue(
              Promise.resolve([
                {
                  ...mockAppointment,
                  startDatetime: newStart,
                  endDatetime: new Date(newStart.getTime() + 1800000),
                },
              ]),
            ),
          }),
        }),
      })
      const res = await request(app)
        .post('/booking/test-business/manage/token-abc-123/reschedule')
        .send({ startTime: newStart.toISOString() })
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual(expect.objectContaining({ id: APPOINTMENT_ID }))
    })

    it('should return 422 for past appointment', async () => {
      const pastAppointment = { ...mockAppointment, startDatetime: new Date('2020-01-01T12:00:00.000Z') }
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([pastAppointment]))
      const res = await request(app)
        .post('/booking/test-business/manage/token-abc-123/reschedule')
        .send({ startTime: '2025-06-01T12:00:00.000Z' })
      expect(res.status).toBe(422)
    })

    it('should return 409 when new slot is not available', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([mockAppointment]))
        .mockReturnValueOnce(selectWithLimit([mockService]))
        .mockReturnValueOnce(selectWithLimit([{ id: 'conflicting-apt' }]))
      const res = await request(app)
        .post('/booking/test-business/manage/token-abc-123/reschedule')
        .send({ startTime: new Date(Date.now() + 172800000).toISOString() })
      expect(res.status).toBe(409)
    })

    it('should return 422 for completed appointment', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([mockOrganization]))
        .mockReturnValueOnce(selectWithLimit([{ ...mockAppointment, status: 'completed' }]))
      const res = await request(app)
        .post('/booking/test-business/manage/token-abc-123/reschedule')
        .send({ startTime: new Date(Date.now() + 172800000).toISOString() })
      expect(res.status).toBe(422)
      expect(res.body.error.code).toBe('NOT_RESCHEDULABLE')
    })
  })
})
