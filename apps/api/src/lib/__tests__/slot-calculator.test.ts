import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
  },
}))

const mockDbSelect = vi.fn()

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: mockDbSelect,
  })),
  schema: {
    services: {
      id: 'id',
      organizationId: 'organization_id',
      durationMinutes: 'duration_minutes',
    },
    organizations: {
      id: 'id',
      timezone: 'timezone',
    },
    schedules: {
      id: 'id',
      serviceId: 'service_id',
      dayOfWeek: 'day_of_week',
      isActive: 'is_active',
    },
    schedulePeriods: {
      id: 'id',
      scheduleId: 'schedule_id',
      startTime: 'start_time',
      endTime: 'end_time',
    },
    timeBlocks: {
      organizationId: 'organization_id',
      date: 'date',
      startTime: 'start_time',
      endTime: 'end_time',
    },
    appointments: {
      serviceId: 'service_id',
      status: 'status',
      startDatetime: 'start_datetime',
      endDatetime: 'end_datetime',
    },
  },
}))

import { fromZonedTime } from 'date-fns-tz'
import type { CalculateSlotsParams } from '../slot-calculator'
import { calculateAvailableSlots } from '../slot-calculator'

const TIMEZONE = 'America/Sao_Paulo'
const ORG_ID = 'org-123'
const SERVICE_ID = 'service-123'
const SCHEDULE_ID = 'schedule-456'

const mockService = {
  id: SERVICE_ID,
  organizationId: ORG_ID,
  name: 'Haircut',
  durationMinutes: 30,
  price: 5000,
  active: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const mockOrganization = {
  id: ORG_ID,
  name: 'Test Org',
  slug: 'test-org',
  timezone: TIMEZONE,
  createdAt: new Date(),
}

const mockSchedule = {
  id: SCHEDULE_ID,
  serviceId: SERVICE_ID,
  dayOfWeek: 5,
  isActive: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const defaultParams: CalculateSlotsParams = {
  serviceId: SERVICE_ID,
  date: '2024-03-15',
  organizationId: ORG_ID,
}

function createSelectWithLimit(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(data)),
      }),
    }),
  }
}

function createSelect(data: unknown[]) {
  return {
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve(data)),
    }),
  }
}

function setupMocks(options: {
  service?: unknown[]
  organization?: unknown[]
  schedule?: unknown[]
  periods?: unknown[]
  blocks?: unknown[]
  appointments?: unknown[]
}) {
  mockDbSelect
    .mockReturnValueOnce(createSelectWithLimit(options.service ?? [mockService]))
    .mockReturnValueOnce(createSelectWithLimit(options.organization ?? [mockOrganization]))
    .mockReturnValueOnce(createSelectWithLimit(options.schedule ?? [mockSchedule]))
    .mockReturnValueOnce(createSelect(options.periods ?? []))
    .mockReturnValueOnce(createSelect(options.blocks ?? []))
    .mockReturnValueOnce(createSelect(options.appointments ?? []))
}

const mockDb = { select: mockDbSelect } as unknown as ReturnType<typeof import('@schedulizer/db').createDb>

describe('calculateAvailableSlots', () => {
  beforeEach(() => {
    mockDbSelect.mockReset()
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-03-01T00:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('slot generation', () => {
    it('should generate correct slots for a simple period (09:00-12:00, 30min service = 6 slots)', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      setupMocks({ periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(6)
      expect(result[0].startTime).toBe(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(result[0].endTime).toBe(fromZonedTime('2024-03-15T09:30:00', TIMEZONE).toISOString())
      expect(result[5].startTime).toBe(fromZonedTime('2024-03-15T11:30:00', TIMEZONE).toISOString())
      expect(result[5].endTime).toBe(fromZonedTime('2024-03-15T12:00:00', TIMEZONE).toISOString())
    })

    it('should generate correct slots for multiple periods', async () => {
      const periods = [
        { id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' },
        { id: 'p2', scheduleId: SCHEDULE_ID, startTime: '14:00', endTime: '18:00' },
      ]
      setupMocks({ periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(14)
      expect(result[0].startTime).toBe(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(result[6].startTime).toBe(fromZonedTime('2024-03-15T14:00:00', TIMEZONE).toISOString())
    })

    it('should generate exactly 1 slot when service duration fills the period', async () => {
      const service = { ...mockService, durationMinutes: 60 }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '10:00' }]
      setupMocks({ service: [service], periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(result[0].endTime).toBe(fromZonedTime('2024-03-15T10:00:00', TIMEZONE).toISOString())
    })

    it('should not generate a slot that extends past the period end', async () => {
      const service = { ...mockService, durationMinutes: 60 }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '11:30' }]
      setupMocks({ service: [service], periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(2)
      expect(result[0].startTime).toBe(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(result[1].startTime).toBe(fromZonedTime('2024-03-15T10:00:00', TIMEZONE).toISOString())
    })
  })

  describe('time block filtering', () => {
    it('should filter out slots that overlap with time blocks', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      const blocks = [
        { id: 'b1', organizationId: ORG_ID, date: '2024-03-15', startTime: '10:00', endTime: '11:00', reason: 'Break' },
      ]
      setupMocks({ periods, blocks })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(4)
      const startTimes = result.map(s => s.startTime)
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T10:00:00', TIMEZONE).toISOString())
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T10:30:00', TIMEZONE).toISOString())
    })

    it('should handle multiple time blocks on the same day', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      const blocks = [
        { id: 'b1', organizationId: ORG_ID, date: '2024-03-15', startTime: '09:30', endTime: '10:00', reason: null },
        { id: 'b2', organizationId: ORG_ID, date: '2024-03-15', startTime: '11:00', endTime: '11:30', reason: null },
      ]
      setupMocks({ periods, blocks })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(4)
      const startTimes = result.map(s => s.startTime)
      expect(startTimes).toContain(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T09:30:00', TIMEZONE).toISOString())
      expect(startTimes).toContain(fromZonedTime('2024-03-15T10:00:00', TIMEZONE).toISOString())
      expect(startTimes).toContain(fromZonedTime('2024-03-15T10:30:00', TIMEZONE).toISOString())
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T11:00:00', TIMEZONE).toISOString())
      expect(startTimes).toContain(fromZonedTime('2024-03-15T11:30:00', TIMEZONE).toISOString())
    })

    it('should return all slots when no time blocks exist', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '10:00' }]
      setupMocks({ periods, blocks: [] })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(2)
    })
  })

  describe('appointment filtering', () => {
    it('should filter out slots that overlap with existing appointments', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      const aptStart = fromZonedTime('2024-03-15T10:00:00', TIMEZONE)
      const aptEnd = fromZonedTime('2024-03-15T10:30:00', TIMEZONE)
      const appointments = [
        {
          id: 'apt-1',
          serviceId: SERVICE_ID,
          status: 'confirmed',
          startDatetime: aptStart,
          endDatetime: aptEnd,
        },
      ]
      setupMocks({ periods, appointments })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(5)
      const startTimes = result.map(s => s.startTime)
      expect(startTimes).not.toContain(aptStart.toISOString())
    })

    it('should not filter slots for cancelled appointments', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      setupMocks({ periods, appointments: [] })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(6)
    })

    it('should filter slots that partially overlap with an appointment', async () => {
      const service = { ...mockService, durationMinutes: 60 }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      const aptStart = fromZonedTime('2024-03-15T09:30:00', TIMEZONE)
      const aptEnd = fromZonedTime('2024-03-15T10:30:00', TIMEZONE)
      const appointments = [
        {
          id: 'apt-1',
          serviceId: SERVICE_ID,
          status: 'pending',
          startDatetime: aptStart,
          endDatetime: aptEnd,
        },
      ]
      setupMocks({ service: [service], periods, appointments })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe(fromZonedTime('2024-03-15T11:00:00', TIMEZONE).toISOString())
    })
  })

  describe('empty results', () => {
    it('should return empty array when service is not found', async () => {
      setupMocks({ service: [] })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })

    it('should return empty array when organization is not found', async () => {
      mockDbSelect
        .mockReturnValueOnce(createSelectWithLimit([mockService]))
        .mockReturnValueOnce(createSelectWithLimit([]))
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })

    it('should return empty array when schedule is inactive', async () => {
      const schedule = { ...mockSchedule, isActive: false }
      mockDbSelect
        .mockReturnValueOnce(createSelectWithLimit([mockService]))
        .mockReturnValueOnce(createSelectWithLimit([mockOrganization]))
        .mockReturnValueOnce(createSelectWithLimit([schedule]))
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })

    it('should return empty array when no schedule exists for the day', async () => {
      mockDbSelect
        .mockReturnValueOnce(createSelectWithLimit([mockService]))
        .mockReturnValueOnce(createSelectWithLimit([mockOrganization]))
        .mockReturnValueOnce(createSelectWithLimit([]))
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })

    it('should return empty array when service duration exceeds period length', async () => {
      const service = { ...mockService, durationMinutes: 180 }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '11:00' }]
      setupMocks({ service: [service], periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })

    it('should return empty array when periods are empty', async () => {
      setupMocks({ periods: [] })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toEqual([])
    })
  })

  describe('timezone conversion', () => {
    it('should return slots in UTC (ISO 8601)', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '10:00' }]
      setupMocks({ periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(2)
      for (const slot of result) {
        expect(slot.startTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
        expect(slot.endTime).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z$/)
      }
    })

    it('should correctly convert Sao Paulo time to UTC (UTC-3)', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '09:30' }]
      setupMocks({ periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe('2024-03-15T12:00:00.000Z')
      expect(result[0].endTime).toBe('2024-03-15T12:30:00.000Z')
    })

    it('should correctly handle UTC timezone', async () => {
      const org = { ...mockOrganization, timezone: 'UTC' }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '09:30' }]
      setupMocks({ organization: [org], periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe('2024-03-15T09:00:00.000Z')
      expect(result[0].endTime).toBe('2024-03-15T09:30:00.000Z')
    })

    it('should correctly handle America/New_York timezone (UTC-4 in March)', async () => {
      const org = { ...mockOrganization, timezone: 'America/New_York' }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '09:30' }]
      setupMocks({ organization: [org], periods })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(1)
      expect(result[0].startTime).toBe('2024-03-15T13:00:00.000Z')
      expect(result[0].endTime).toBe('2024-03-15T13:30:00.000Z')
    })

    it('should handle DST transition day correctly', async () => {
      const org = { ...mockOrganization, timezone: 'America/New_York' }
      const schedule = { ...mockSchedule, dayOfWeek: 0 }
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '10:00' }]
      const params: CalculateSlotsParams = { ...defaultParams, date: '2024-03-10' }
      setupMocks({ organization: [org], schedule: [schedule], periods })
      const result = await calculateAvailableSlots(params, mockDb)
      expect(result).toHaveLength(2)
      expect(result[0].startTime).toBe('2024-03-10T13:00:00.000Z')
      expect(result[0].endTime).toBe('2024-03-10T13:30:00.000Z')
      expect(result[1].startTime).toBe('2024-03-10T13:30:00.000Z')
      expect(result[1].endTime).toBe('2024-03-10T14:00:00.000Z')
    })
  })

  describe('combined filtering', () => {
    it('should filter by both time blocks and appointments', async () => {
      const periods = [{ id: 'p1', scheduleId: SCHEDULE_ID, startTime: '09:00', endTime: '12:00' }]
      const blocks = [
        { id: 'b1', organizationId: ORG_ID, date: '2024-03-15', startTime: '09:00', endTime: '09:30', reason: null },
      ]
      const aptStart = fromZonedTime('2024-03-15T11:00:00', TIMEZONE)
      const aptEnd = fromZonedTime('2024-03-15T11:30:00', TIMEZONE)
      const appointments = [
        {
          id: 'apt-1',
          serviceId: SERVICE_ID,
          status: 'confirmed',
          startDatetime: aptStart,
          endDatetime: aptEnd,
        },
      ]
      setupMocks({ periods, blocks, appointments })
      const result = await calculateAvailableSlots(defaultParams, mockDb)
      expect(result).toHaveLength(4)
      const startTimes = result.map(s => s.startTime)
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T09:00:00', TIMEZONE).toISOString())
      expect(startTimes).not.toContain(fromZonedTime('2024-03-15T11:00:00', TIMEZONE).toISOString())
      expect(startTimes).toContain(fromZonedTime('2024-03-15T09:30:00', TIMEZONE).toISOString())
      expect(startTimes).toContain(fromZonedTime('2024-03-15T10:00:00', TIMEZONE).toISOString())
    })
  })
})
