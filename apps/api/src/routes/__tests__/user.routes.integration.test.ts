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
  user: { id: 'user-owner', email: 'owner@example.com', name: 'Owner User' },
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
    members: {
      id: 'id',
      userId: 'user_id',
      organizationId: 'organization_id',
      role: 'role',
      createdAt: 'created_at',
    },
    users: {
      id: 'id',
      email: 'email',
      phoneNumber: 'phone_number',
      name: 'name',
    },
  },
}))

import { userRoutes } from '../user.routes'

const app = express()
app.use(express.json())
app.use('/users', userRoutes)

const TARGET_USER_ID = 'user-target-123'

function selectWithLimit(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(data)),
      }),
    }),
  }
}

function updateWithReturning(data: unknown[]) {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockReturnValue(Promise.resolve(data)),
      }),
    }),
  }
}

function updateWithError(error: Error) {
  return {
    set: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        returning: vi.fn().mockRejectedValue(error),
      }),
    }),
  }
}

describe('PATCH /users/:userId', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetSession.mockResolvedValue(mockSession)
    mockDbUpdate.mockReturnValue(
      updateWithReturning([{ id: TARGET_USER_ID, phoneNumber: '+5511999999999', email: 'updated@example.com' }]),
    )
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('authorization', () => {
    it('should return 401 when unauthenticated', async () => {
      mockGetSession.mockResolvedValue(null)
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should return 401 when no active organization in session', async () => {
      mockGetSession.mockResolvedValue({
        user: { id: 'user-owner', email: 'owner@example.com', name: 'Owner User' },
        session: { activeOrganizationId: null },
      } as unknown as typeof mockSession)
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(401)
      expect(res.body.error.code).toBe('UNAUTHORIZED')
    })

    it('should allow self-edit for any user', async () => {
      const selfUserId = 'user-owner'
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ userId: selfUserId }]))
      const res = await request(app).patch(`/users/${selfUserId}`).send({ phoneNumber: '+5511999999999' })
      expect(res.status).toBe(200)
    })

    it('should allow owner to update org member', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ phoneNumber: '+5511999999999' })
      expect(res.status).toBe(200)
    })

    it('should allow admin to update org member email', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'admin' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'updated@example.com' })
      expect(res.status).toBe(200)
    })

    it('should return 403 when member attempts to update another member', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ role: 'member' }]))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('should return 403 when non-member user attempts to update org member', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([]))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(403)
      expect(res.body.error.code).toBe('FORBIDDEN')
    })

    it('should return 404 when target userId not found in organization', async () => {
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ role: 'owner' }])).mockReturnValueOnce(selectWithLimit([]))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(404)
      expect(res.body.error.code).toBe('NOT_FOUND')
    })
  })

  describe('validation', () => {
    it('should return 400 when no fields provided (empty body)', async () => {
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({})
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST')
    })

    it('should return 400 for invalid email format', async () => {
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'not-an-email' })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST')
    })

    it('should return 400 for invalid phone format (not E.164)', async () => {
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ phoneNumber: '11999999999' })
      expect(res.status).toBe(400)
      expect(res.body.error.code).toBe('INVALID_REQUEST')
    })
  })

  describe('success', () => {
    it('should update phone of org member and return 200', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      mockDbUpdate.mockReturnValueOnce(
        updateWithReturning([{ id: TARGET_USER_ID, phoneNumber: '+5511999999999', email: 'existing@example.com' }]),
      )
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ phoneNumber: '+5511999999999' })
      expect(res.status).toBe(200)
      expect(res.body.data).toEqual({
        id: TARGET_USER_ID,
        phoneNumber: '+5511999999999',
        email: 'existing@example.com',
      })
    })

    it('should update email of org member and return 200', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'admin' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      mockDbUpdate.mockReturnValueOnce(
        updateWithReturning([{ id: TARGET_USER_ID, phoneNumber: '+5511888888888', email: 'new@example.com' }]),
      )
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'new@example.com' })
      expect(res.status).toBe(200)
      expect(res.body.data.email).toBe('new@example.com')
    })

    it('should update both phone and email in single request', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      mockDbUpdate.mockReturnValueOnce(
        updateWithReturning([{ id: TARGET_USER_ID, phoneNumber: '+5511777777777', email: 'both@example.com' }]),
      )
      const res = await request(app)
        .patch(`/users/${TARGET_USER_ID}`)
        .send({ phoneNumber: '+5511777777777', email: 'both@example.com' })
      expect(res.status).toBe(200)
      expect(res.body.data.phoneNumber).toBe('+5511777777777')
      expect(res.body.data.email).toBe('both@example.com')
    })

    it('should call db.update with the user table', async () => {
      const selfUserId = 'user-owner'
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ userId: selfUserId }]))
      mockDbUpdate.mockReturnValueOnce(
        updateWithReturning([{ id: selfUserId, phoneNumber: null, email: 'self@example.com' }]),
      )
      await request(app).patch(`/users/${selfUserId}`).send({ email: 'self@example.com' })
      expect(mockDbUpdate).toHaveBeenCalled()
    })
  })

  describe('duplicate handling', () => {
    it('should return 409 when email already in use by another user', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      mockDbUpdate.mockReturnValueOnce(updateWithError(new Error('unique constraint violation on email')))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ email: 'taken@example.com' })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DUPLICATE_EMAIL')
    })

    it('should return 409 when phone number already in use by another user', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      mockDbUpdate.mockReturnValueOnce(updateWithError(new Error('UNIQUE constraint violation')))
      const res = await request(app).patch(`/users/${TARGET_USER_ID}`).send({ phoneNumber: '+5511999999999' })
      expect(res.status).toBe(409)
      expect(res.body.error.code).toBe('DUPLICATE_PHONE')
    })
  })

  describe('error handling', () => {
    it('should return 500 for unexpected errors', async () => {
      const selfUserId = 'user-owner'
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ userId: selfUserId }]))
      mockDbUpdate.mockReturnValueOnce(updateWithError(new Error('Database connection lost')))
      const res = await request(app).patch(`/users/${selfUserId}`).send({ email: 'test@example.com' })
      expect(res.status).toBe(500)
      expect(res.body.error.code).toBe('INTERNAL_ERROR')
    })
  })

  describe('multi-tenancy security', () => {
    it('should use organizationId from session, not from request body', async () => {
      mockDbSelect
        .mockReturnValueOnce(selectWithLimit([{ role: 'owner' }]))
        .mockReturnValueOnce(selectWithLimit([{ userId: TARGET_USER_ID }]))
      const res = await request(app)
        .patch(`/users/${TARGET_USER_ID}`)
        .send({ email: 'new@example.com', organizationId: 'attacker-org' })
      expect(res.status).toBe(200)
    })
  })

  describe('requireSubscription middleware', () => {
    it('should apply requireSubscription middleware on requests', async () => {
      const selfUserId = 'user-owner'
      mockDbSelect.mockReturnValueOnce(selectWithLimit([{ userId: selfUserId }]))
      await request(app).patch(`/users/${selfUserId}`).send({ email: 'test@example.com' })
      const { requireSubscription } = await import('../../middlewares/require-subscription.middleware')
      expect(requireSubscription).toHaveBeenCalled()
    })
  })
})
