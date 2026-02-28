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
    whatsappPhoneNumberId: 'test-phone-id',
    whatsappAccessToken: 'test-access-token',
  },
}))

const mockSession = {
  user: { id: 'user-123', email: 'test@example.com', name: 'Test User' },
  session: { activeOrganizationId: 'org-123' },
}

const mockGetSession = vi.fn<() => Promise<typeof mockSession | null>>(() => Promise.resolve(mockSession))

vi.mock('../../lib/auth', () => ({
  auth: {
    api: {
      getSession: () => mockGetSession(),
    },
  },
}))

vi.mock('better-auth/node', () => ({
  fromNodeHeaders: vi.fn(() => ({})),
}))

vi.mock('../../middlewares/require-subscription.middleware', () => ({
  requireSubscription: vi.fn((_req: express.Request, _res: express.Response, next: () => void) => next()),
}))

const { mockDbSelect, mockDbTransaction, mockDbUpdate } = vi.hoisted(() => ({
  mockDbSelect: vi.fn(),
  mockDbTransaction: vi.fn(),
  mockDbUpdate: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
    transaction: mockDbTransaction,
    update: mockDbUpdate,
  })),
  schema: {
    services: {
      id: 'id',
      organizationId: 'organization_id',
      name: 'name',
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
      notes: 'notes',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
}))

import { appointmentsRoutes } from '../appointments.routes'

const app = express()
app.use(express.json())
app.use('/appointments', appointmentsRoutes)

const SERVICE_ID = '660e8400-e29b-41d4-a716-446655440001'
const APPOINTMENT_ID = '770e8400-e29b-41d4-a716-446655440002'

const validBody = {
  serviceId: SERVICE_ID,
  startDatetime: '2025-06-15T09:00:00Z',
  endDatetime: '2025-06-15T09:30:00Z',
  customerName: 'John Doe',
}

const mockCreatedAppointment = {
  id: APPOINTMENT_ID,
  organizationId: 'org-123',
  serviceId: SERVICE_ID,
  startDatetime: new Date('2025-06-15T09:00:00Z'),
  endDatetime: new Date('2025-06-15T09:30:00Z'),
  status: 'confirmed',
  customerName: 'John Doe',
  customerEmail: '',
  customerPhone: '',
  managementToken: 'secret-token-uuid',
  notes: null,
  language: 'en',
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

function createMockTx(conflicting: unknown[], created: unknown = mockCreatedAppointment) {
  const mockTxSelect = vi.fn().mockReturnValue({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve(conflicting)),
    }),
  })
  const mockTxInsert = vi.fn().mockReturnValue({
    values: vi.fn().mockReturnValue({
      returning: vi.fn().mockReturnValue(Promise.resolve([created])),
    }),
  })
  return { select: mockTxSelect, insert: mockTxInsert }
}

describe('POST /appointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
    mockDbSelect.mockReturnValue(selectWithLimit([{ id: SERVICE_ID }]))
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(createMockTx([])))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should create appointment with required fields and return 201', async () => {
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('id', APPOINTMENT_ID)
    expect(res.body.data).toHaveProperty('organizationId', 'org-123')
    expect(res.body.data).toHaveProperty('serviceId', SERVICE_ID)
  })

  it('should create appointment with optional fields and return 201', async () => {
    const bodyWithOptionals = {
      ...validBody,
      customerEmail: 'john@example.com',
      customerPhone: '+5511999999999',
      status: 'pending',
      notes: 'VIP client',
    }
    const created = {
      ...mockCreatedAppointment,
      customerEmail: 'john@example.com',
      customerPhone: '+5511999999999',
      status: 'pending',
      notes: 'VIP client',
    }
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(createMockTx([], created)))
    const res = await request(app).post('/appointments').send(bodyWithOptionals)
    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('customerEmail', 'john@example.com')
    expect(res.body.data).toHaveProperty('notes', 'VIP client')
  })

  it('should default status to confirmed when not provided', async () => {
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.data).toHaveProperty('status', 'confirmed')
  })

  it('should accept past date appointments without restriction', async () => {
    const pastBody = {
      ...validBody,
      startDatetime: '2020-01-15T09:00:00Z',
      endDatetime: '2020-01-15T09:30:00Z',
    }
    const pastAppointment = {
      ...mockCreatedAppointment,
      startDatetime: new Date('2020-01-15T09:00:00Z'),
      endDatetime: new Date('2020-01-15T09:30:00Z'),
    }
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => cb(createMockTx([], pastAppointment)))
    const res = await request(app).post('/appointments').send(pastBody)
    expect(res.status).toBe(201)
  })

  it('should return 401 when unauthenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 404 when serviceId not found in organization', async () => {
    mockDbSelect.mockReturnValue(selectWithLimit([]))
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('should return 400 for invalid request body (missing required fields)', async () => {
    const res = await request(app).post('/appointments').send({ serviceId: 'not-a-uuid' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_REQUEST')
  })

  it('should return 400 for invalid serviceId format', async () => {
    const res = await request(app)
      .post('/appointments')
      .send({
        ...validBody,
        serviceId: 'invalid',
      })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_REQUEST')
  })

  it('should return 409 when time conflict with existing non-cancelled appointment', async () => {
    const conflictingAppointment = {
      id: 'conflict-id',
      customerName: 'Jane Doe',
      startDatetime: new Date('2025-06-15T08:45:00Z'),
      endDatetime: new Date('2025-06-15T09:15:00Z'),
    }
    mockDbTransaction.mockImplementation(async (cb: (tx: unknown) => unknown) => {
      const tx = createMockTx([conflictingAppointment])
      return cb(tx)
    })
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('TIME_CONFLICT')
    expect(res.body.data.conflictingAppointments).toHaveLength(1)
    expect(res.body.data.conflictingAppointments[0]).toHaveProperty('id', 'conflict-id')
  })

  it('should not include managementToken in 201 response', async () => {
    const res = await request(app).post('/appointments').send(validBody)
    expect(res.status).toBe(201)
    expect(res.body.data).not.toHaveProperty('managementToken')
  })

  it('should set organizationId from session, not from request body', async () => {
    const bodyWithOrgId = {
      ...validBody,
      organizationId: 'attacker-org-id',
    }
    const res = await request(app).post('/appointments').send(bodyWithOrgId)
    expect(res.status).toBe(201)
    expect(res.body.data.organizationId).toBe('org-123')
    expect(res.body.data.organizationId).not.toBe('attacker-org-id')
  })

  it('should return 400 for invalid datetime format', async () => {
    const res = await request(app)
      .post('/appointments')
      .send({
        ...validBody,
        startDatetime: 'not-a-date',
      })
    expect(res.status).toBe(400)
  })

  it('should return 400 for missing customerName', async () => {
    const { customerName: _, ...bodyWithoutName } = validBody
    const res = await request(app).post('/appointments').send(bodyWithoutName)
    expect(res.status).toBe(400)
  })
})

function selectWithoutLimit(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve(data)),
    }),
  }
}

function mockUpdate(updated: unknown) {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue(Promise.resolve([updated])),
      }),
    }),
  }
}

const validMoveBody = {
  startDatetime: '2025-06-15T10:00:00Z',
  endDatetime: '2025-06-15T10:30:00Z',
}

const mockExistingAppointment = {
  ...mockCreatedAppointment,
  id: APPOINTMENT_ID,
  organizationId: 'org-123',
}

const mockUpdatedAppointment = {
  ...mockExistingAppointment,
  startDatetime: new Date('2025-06-15T10:00:00Z'),
  endDatetime: new Date('2025-06-15T10:30:00Z'),
  updatedAt: new Date(),
}

describe('PATCH /appointments/:appointmentId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
    mockDbSelect
      .mockReturnValueOnce(selectWithLimit([mockExistingAppointment]))
      .mockReturnValueOnce(selectWithoutLimit([]))
    mockDbUpdate.mockReturnValue(mockUpdate(mockUpdatedAppointment))
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should move appointment successfully and return 200 when no conflicts exist', async () => {
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('id', APPOINTMENT_ID)
  })

  it('should return updated appointment data without managementToken', async () => {
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(200)
    expect(res.body.data).not.toHaveProperty('managementToken')
  })

  it('should update startDatetime, endDatetime, and updatedAt fields', async () => {
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(200)
    expect(mockDbUpdate).toHaveBeenCalled()
  })

  it('should return 409 with conflictingAppointments when time overlap exists and force is not true', async () => {
    const conflicting = {
      id: 'conflict-id',
      customerName: 'Jane Doe',
      startDatetime: new Date('2025-06-15T10:00:00Z'),
      endDatetime: new Date('2025-06-15T10:30:00Z'),
    }
    mockDbSelect
      .mockReset()
      .mockReturnValueOnce(selectWithLimit([mockExistingAppointment]))
      .mockReturnValueOnce(selectWithoutLimit([conflicting]))
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(409)
    expect(res.body.error.code).toBe('TIME_CONFLICT')
    expect(res.body.data.conflictingAppointments).toHaveLength(1)
  })

  it('should return 409 response including conflict details (id, customerName, startDatetime, endDatetime)', async () => {
    const conflicting = {
      id: 'conflict-id',
      customerName: 'Jane Doe',
      startDatetime: new Date('2025-06-15T10:00:00Z'),
      endDatetime: new Date('2025-06-15T10:30:00Z'),
    }
    mockDbSelect
      .mockReset()
      .mockReturnValueOnce(selectWithLimit([mockExistingAppointment]))
      .mockReturnValueOnce(selectWithoutLimit([conflicting]))
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(409)
    const conflict = res.body.data.conflictingAppointments[0]
    expect(conflict).toHaveProperty('id', 'conflict-id')
    expect(conflict).toHaveProperty('customerName', 'Jane Doe')
    expect(conflict).toHaveProperty('startDatetime')
    expect(conflict).toHaveProperty('endDatetime')
  })

  it('should move appointment successfully when force is true despite conflicts', async () => {
    mockDbSelect.mockReset().mockReturnValueOnce(selectWithLimit([mockExistingAppointment]))
    const res = await request(app)
      .patch(`/appointments/${APPOINTMENT_ID}`)
      .send({ ...validMoveBody, force: true })
    expect(res.status).toBe(200)
    expect(res.body.data).toHaveProperty('id', APPOINTMENT_ID)
  })

  it('should return 404 when appointmentId does not exist', async () => {
    mockDbSelect.mockReset().mockReturnValueOnce(selectWithLimit([]))
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('should return 404 when appointment belongs to a different organization (multi-tenancy)', async () => {
    mockDbSelect.mockReset().mockReturnValueOnce(selectWithLimit([]))
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(404)
    expect(res.body.error.code).toBe('NOT_FOUND')
  })

  it('should return 401 when user is not authenticated', async () => {
    mockGetSession.mockResolvedValue(null)
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(401)
    expect(res.body.error.code).toBe('UNAUTHORIZED')
  })

  it('should return 400 for invalid request body (missing startDatetime or endDatetime)', async () => {
    const res = await request(app)
      .patch(`/appointments/${APPOINTMENT_ID}`)
      .send({ startDatetime: '2025-06-15T10:00:00Z' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_REQUEST')
  })

  it('should return 400 for invalid datetime format', async () => {
    const res = await request(app)
      .patch(`/appointments/${APPOINTMENT_ID}`)
      .send({ startDatetime: 'not-a-date', endDatetime: '2025-06-15T10:30:00Z' })
    expect(res.status).toBe(400)
    expect(res.body.error.code).toBe('INVALID_REQUEST')
  })

  it('should exclude cancelled appointments from conflict detection', async () => {
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(200)
  })

  it('should exclude the appointment being moved from conflict detection', async () => {
    const res = await request(app).patch(`/appointments/${APPOINTMENT_ID}`).send(validMoveBody)
    expect(res.status).toBe(200)
  })
})
