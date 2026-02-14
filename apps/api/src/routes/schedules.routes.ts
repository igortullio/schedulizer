import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { BulkUpsertSchedulesSchema } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { auth } from '../lib/auth'
import { requireSubscription } from '../middlewares/require-subscription.middleware'

const router = Router({ mergeParams: true })
const db = createDb(serverEnv.databaseUrl)

const DAYS_IN_WEEK = 7

router.use(requireSubscription)

router.get('/:serviceId/schedules', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const organizationId = session.session.activeOrganizationId
    if (!organizationId) {
      return res.status(400).json({
        error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
      })
    }
    const { serviceId } = req.params
    const [service] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.organizationId, organizationId)))
      .limit(1)
    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const schedules = await db.select().from(schema.schedules).where(eq(schema.schedules.serviceId, serviceId))
    const periodsMap = new Map<
      string,
      { id: string; scheduleId: string; startTime: string; endTime: string; createdAt: Date; updatedAt: Date }[]
    >()
    for (const schedule of schedules) {
      const schedulePeriods = await db
        .select()
        .from(schema.schedulePeriods)
        .where(eq(schema.schedulePeriods.scheduleId, schedule.id))
      periodsMap.set(schedule.id, schedulePeriods)
    }
    const result = Array.from({ length: DAYS_IN_WEEK }, (_, dayOfWeek) => {
      const schedule = schedules.find(s => s.dayOfWeek === dayOfWeek)
      if (schedule) {
        const schedulePeriods = periodsMap.get(schedule.id) ?? []
        return {
          dayOfWeek,
          isActive: schedule.isActive,
          periods: schedulePeriods.map(p => ({
            id: p.id,
            startTime: p.startTime,
            endTime: p.endTime,
          })),
        }
      }
      return {
        dayOfWeek,
        isActive: false,
        periods: [],
      }
    })
    return res.status(200).json({ data: result })
  } catch (error) {
    console.error('Get schedules error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.put('/:serviceId/schedules', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const organizationId = session.session.activeOrganizationId
    if (!organizationId) {
      return res.status(400).json({
        error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
      })
    }
    const validation = BulkUpsertSchedulesSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { serviceId } = req.params
    const [service] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.organizationId, organizationId)))
      .limit(1)
    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const overlappingError = validatePeriodsOverlap(validation.data.schedules)
    if (overlappingError) {
      return res.status(400).json({
        error: { message: overlappingError, code: 'INVALID_REQUEST' },
      })
    }
    const result = await db.transaction(async tx => {
      for (const scheduleInput of validation.data.schedules) {
        const [existing] = await tx
          .select()
          .from(schema.schedules)
          .where(
            and(eq(schema.schedules.serviceId, serviceId), eq(schema.schedules.dayOfWeek, scheduleInput.dayOfWeek)),
          )
          .limit(1)
        if (existing) {
          await tx
            .update(schema.schedules)
            .set({ isActive: scheduleInput.isActive, updatedAt: new Date() })
            .where(eq(schema.schedules.id, existing.id))
          await tx.delete(schema.schedulePeriods).where(eq(schema.schedulePeriods.scheduleId, existing.id))
          if (scheduleInput.periods.length > 0) {
            await tx.insert(schema.schedulePeriods).values(
              scheduleInput.periods.map(period => ({
                scheduleId: existing.id,
                startTime: period.startTime,
                endTime: period.endTime,
              })),
            )
          }
        } else {
          const [newSchedule] = await tx
            .insert(schema.schedules)
            .values({
              serviceId,
              dayOfWeek: scheduleInput.dayOfWeek,
              isActive: scheduleInput.isActive,
            })
            .returning()
          if (scheduleInput.periods.length > 0) {
            await tx.insert(schema.schedulePeriods).values(
              scheduleInput.periods.map(period => ({
                scheduleId: newSchedule.id,
                startTime: period.startTime,
                endTime: period.endTime,
              })),
            )
          }
        }
      }
      const updatedSchedules = await tx.select().from(schema.schedules).where(eq(schema.schedules.serviceId, serviceId))
      const periodsMap = new Map<string, { id: string; startTime: string; endTime: string }[]>()
      for (const schedule of updatedSchedules) {
        const schedulePeriods = await tx
          .select()
          .from(schema.schedulePeriods)
          .where(eq(schema.schedulePeriods.scheduleId, schedule.id))
        periodsMap.set(
          schedule.id,
          schedulePeriods.map(p => ({
            id: p.id,
            startTime: p.startTime,
            endTime: p.endTime,
          })),
        )
      }
      return updatedSchedules.map(s => ({
        dayOfWeek: s.dayOfWeek,
        isActive: s.isActive,
        periods: periodsMap.get(s.id) ?? [],
      }))
    })
    console.log('Schedules updated', { serviceId, organizationId })
    return res.status(200).json({ data: result })
  } catch (error) {
    console.error('Update schedules error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

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

export const schedulesRoutes = router
