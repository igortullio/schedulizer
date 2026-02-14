import { describe, expect, it } from 'vitest'

interface PeriodInput {
  startTime: string
  endTime: string
}

interface ScheduleInput {
  dayOfWeek: number
  isActive: boolean
  periods: PeriodInput[]
}

function validatePeriodsOverlap(schedules: ScheduleInput[]): string | null {
  for (const schedule of schedules) {
    const sorted = [...schedule.periods].sort((a, b) => a.startTime.localeCompare(b.startTime))
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i].startTime < sorted[i - 1].endTime) {
        return `Overlapping periods on day ${schedule.dayOfWeek}`
      }
    }
  }
  return null
}

describe('validatePeriodsOverlap', () => {
  it('returns null for non-overlapping periods', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 1,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '12:00' },
          { startTime: '14:00', endTime: '18:00' },
        ],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBeNull()
  })

  it('returns error for overlapping periods on same day', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 1,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '13:00' },
          { startTime: '12:00', endTime: '18:00' },
        ],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBe('Overlapping periods on day 1')
  })

  it('returns null for empty periods', () => {
    const schedules: ScheduleInput[] = [{ dayOfWeek: 0, isActive: false, periods: [] }]
    expect(validatePeriodsOverlap(schedules)).toBeNull()
  })

  it('returns null for single period', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 2,
        isActive: true,
        periods: [{ startTime: '09:00', endTime: '17:00' }],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBeNull()
  })

  it('returns null for adjacent periods with no gap', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 3,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '12:00' },
          { startTime: '12:00', endTime: '18:00' },
        ],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBeNull()
  })

  it('detects overlap even when periods are not sorted', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 4,
        isActive: true,
        periods: [
          { startTime: '14:00', endTime: '18:00' },
          { startTime: '08:00', endTime: '15:00' },
        ],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBe('Overlapping periods on day 4')
  })

  it('validates multiple days independently', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 1,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '12:00' },
          { startTime: '14:00', endTime: '18:00' },
        ],
      },
      {
        dayOfWeek: 2,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '14:00' },
          { startTime: '13:00', endTime: '18:00' },
        ],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBe('Overlapping periods on day 2')
  })

  it('returns null for multiple valid days', () => {
    const schedules: ScheduleInput[] = [
      {
        dayOfWeek: 1,
        isActive: true,
        periods: [{ startTime: '09:00', endTime: '17:00' }],
      },
      {
        dayOfWeek: 2,
        isActive: true,
        periods: [
          { startTime: '08:00', endTime: '12:00' },
          { startTime: '13:00', endTime: '17:00' },
        ],
      },
      {
        dayOfWeek: 3,
        isActive: false,
        periods: [],
      },
    ]
    expect(validatePeriodsOverlap(schedules)).toBeNull()
  })
})
