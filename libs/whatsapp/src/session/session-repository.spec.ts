import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SessionDb } from './session-repository'
import { SessionRepository } from './session-repository'

function createMockDb(): SessionDb {
  return {
    findActiveByPhone: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    deleteExpired: vi.fn(),
  }
}

const PHONE = '+5511999999999'
const ORG_ID = 'org-123'

function createDbRow(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'session-1',
    phoneNumber: PHONE,
    organizationId: ORG_ID,
    currentStep: 'welcome',
    context: {},
    createdAt: new Date('2026-01-01T10:00:00Z'),
    updatedAt: new Date('2026-01-01T10:00:00Z'),
    ...overrides,
  }
}

describe('SessionRepository', () => {
  let mockDb: SessionDb
  let repository: SessionRepository

  beforeEach(() => {
    mockDb = createMockDb()
    repository = new SessionRepository(mockDb)
  })

  describe('findActiveByPhone', () => {
    it('should return session when found', async () => {
      const row = createDbRow()
      vi.mocked(mockDb.findActiveByPhone).mockResolvedValueOnce(row)
      const result = await repository.findActiveByPhone(PHONE, ORG_ID)
      expect(result).toEqual({
        id: 'session-1',
        phoneNumber: PHONE,
        organizationId: ORG_ID,
        currentStep: 'welcome',
        context: {},
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
      })
      expect(mockDb.findActiveByPhone).toHaveBeenCalledWith(PHONE, ORG_ID, expect.any(Date))
    })

    it('should return null when no session found', async () => {
      vi.mocked(mockDb.findActiveByPhone).mockResolvedValueOnce(undefined)
      const result = await repository.findActiveByPhone(PHONE, ORG_ID)
      expect(result).toBeNull()
    })

    it('should pass TTL threshold date to db', async () => {
      vi.mocked(mockDb.findActiveByPhone).mockResolvedValueOnce(undefined)
      const before = Date.now()
      await repository.findActiveByPhone(PHONE, ORG_ID)
      const [, , ttlThreshold] = vi.mocked(mockDb.findActiveByPhone).mock.calls[0]
      const expectedApprox = before - 30 * 60 * 1000
      expect(ttlThreshold.getTime()).toBeGreaterThanOrEqual(expectedApprox - 100)
      expect(ttlThreshold.getTime()).toBeLessThanOrEqual(expectedApprox + 100)
    })
  })

  describe('create', () => {
    it('should create a new session and return it', async () => {
      const row = createDbRow()
      vi.mocked(mockDb.create).mockResolvedValueOnce(row)
      const result = await repository.create({ phoneNumber: PHONE, organizationId: ORG_ID })
      expect(result.id).toBe('session-1')
      expect(result.currentStep).toBe('welcome')
      expect(mockDb.create).toHaveBeenCalledWith({ phoneNumber: PHONE, organizationId: ORG_ID })
    })
  })

  describe('update', () => {
    it('should update session step and context', async () => {
      const updatedRow = createDbRow({ currentStep: 'select_service', context: { availableServices: [] } })
      vi.mocked(mockDb.update).mockResolvedValueOnce(updatedRow)
      const result = await repository.update('session-1', {
        currentStep: 'select_service',
        context: { availableServices: [] },
      })
      expect(result.currentStep).toBe('select_service')
      expect(mockDb.update).toHaveBeenCalledWith('session-1', {
        currentStep: 'select_service',
        context: { availableServices: [] },
      })
    })
  })

  describe('deleteExpired', () => {
    it('should call db deleteExpired with TTL threshold', async () => {
      vi.mocked(mockDb.deleteExpired).mockResolvedValueOnce(undefined)
      await repository.deleteExpired()
      expect(mockDb.deleteExpired).toHaveBeenCalledWith(expect.any(Date))
    })
  })
})
