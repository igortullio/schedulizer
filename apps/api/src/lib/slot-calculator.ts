import { type createDb, schema } from '@schedulizer/db'
import type { TimeSlot } from '@schedulizer/shared-types'
import { fromZonedTime } from 'date-fns-tz'
import { and, eq, gt, lt, ne } from 'drizzle-orm'

type Database = ReturnType<typeof createDb>

export interface CalculateSlotsParams {
  serviceId: string
  date: string
  organizationId: string
}

const MINUTES_PER_HOUR = 60

function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number)
  return hours * MINUTES_PER_HOUR + minutes
}

function minutesToTimeString(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / MINUTES_PER_HOUR)
  const minutes = totalMinutes % MINUTES_PER_HOUR
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`
}

function hasOverlap(startA: number, endA: number, startB: number, endB: number): boolean {
  return startA < endB && endA > startB
}

function localTimeToUtc(date: string, time: string, timezone: string): Date {
  return fromZonedTime(`${date}T${time}:00`, timezone)
}

function formatNextDate(year: number, month: number, day: number): string {
  const nextDate = new Date(year, month - 1, day + 1)
  const y = nextDate.getFullYear()
  const m = (nextDate.getMonth() + 1).toString().padStart(2, '0')
  const d = nextDate.getDate().toString().padStart(2, '0')
  return `${y}-${m}-${d}`
}

export async function calculateAvailableSlots(params: CalculateSlotsParams, db: Database): Promise<TimeSlot[]> {
  const { serviceId, date, organizationId } = params
  const [service] = await db
    .select()
    .from(schema.services)
    .where(and(eq(schema.services.id, serviceId), eq(schema.services.organizationId, organizationId)))
    .limit(1)
  if (!service) return []
  const [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.id, organizationId))
    .limit(1)
  if (!organization) return []
  const { timezone } = organization
  const { durationMinutes } = service
  const [year, month, day] = date.split('-').map(Number)
  const dayOfWeek = new Date(year, month - 1, day).getDay()
  const [schedule] = await db
    .select()
    .from(schema.schedules)
    .where(and(eq(schema.schedules.serviceId, serviceId), eq(schema.schedules.dayOfWeek, dayOfWeek)))
    .limit(1)
  if (!schedule || !schedule.isActive) return []
  const periods = await db
    .select()
    .from(schema.schedulePeriods)
    .where(eq(schema.schedulePeriods.scheduleId, schedule.id))
  if (periods.length === 0) return []
  const blocks = await db
    .select()
    .from(schema.timeBlocks)
    .where(and(eq(schema.timeBlocks.organizationId, organizationId), eq(schema.timeBlocks.date, date)))
  const dayStartUtc = localTimeToUtc(date, '00:00', timezone)
  const nextDateStr = formatNextDate(year, month, day)
  const dayEndUtc = localTimeToUtc(nextDateStr, '00:00', timezone)
  const appointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        eq(schema.appointments.serviceId, serviceId),
        ne(schema.appointments.status, 'cancelled'),
        lt(schema.appointments.startDatetime, dayEndUtc),
        gt(schema.appointments.endDatetime, dayStartUtc),
      ),
    )
  const blockRanges = blocks.map(block => ({
    start: timeToMinutes(block.startTime),
    end: timeToMinutes(block.endTime),
  }))
  const now = new Date()
  const slots: TimeSlot[] = []
  for (const period of periods) {
    const periodStartMin = timeToMinutes(period.startTime)
    const periodEndMin = timeToMinutes(period.endTime)
    let slotStartMin = periodStartMin
    while (slotStartMin + durationMinutes <= periodEndMin) {
      const slotEndMin = slotStartMin + durationMinutes
      const overlapsBlock = blockRanges.some(block => hasOverlap(slotStartMin, slotEndMin, block.start, block.end))
      if (!overlapsBlock) {
        const slotStartTime = minutesToTimeString(slotStartMin)
        const slotEndTime = minutesToTimeString(slotEndMin)
        const slotStartUtc = localTimeToUtc(date, slotStartTime, timezone)
        const slotEndUtc = localTimeToUtc(date, slotEndTime, timezone)
        const overlapsAppointment = appointments.some(
          apt =>
            slotStartUtc.getTime() < apt.endDatetime.getTime() && slotEndUtc.getTime() > apt.startDatetime.getTime(),
        )
        if (!overlapsAppointment && slotStartUtc > now) {
          slots.push({
            startTime: slotStartUtc.toISOString(),
            endTime: slotEndUtc.toISOString(),
          })
        }
      }
      slotStartMin += durationMinutes
    }
  }
  return slots
}
