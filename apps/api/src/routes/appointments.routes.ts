import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq, gte, lte } from 'drizzle-orm'
import { Router } from 'express'
import { auth } from '../lib/auth'
import { requireSubscription } from '../middlewares/require-subscription.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const VALID_STATUSES: AppointmentStatus[] = ['pending', 'confirmed', 'cancelled', 'completed', 'no_show']
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

const VALID_TRANSITIONS: Record<string, AppointmentStatus[]> = {
  pending: ['confirmed', 'cancelled'],
  confirmed: ['completed', 'no_show', 'cancelled'],
}

async function getSessionAndOrg(req: { headers: Record<string, string | string[] | undefined> }) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  if (!session) return null
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return null
  return { session, organizationId }
}

async function transitionStatus(
  req: { params: Record<string, string>; headers: Record<string, string | string[] | undefined> },
  res: { status: (code: number) => { json: (body: unknown) => unknown } },
  targetStatus: AppointmentStatus,
) {
  try {
    const sessionData = await getSessionAndOrg(req)
    if (!sessionData) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const { organizationId } = sessionData
    const { appointmentId } = req.params
    const [appointment] = await db
      .select()
      .from(schema.appointments)
      .where(and(eq(schema.appointments.id, appointmentId), eq(schema.appointments.organizationId, organizationId)))
      .limit(1)
    if (!appointment) {
      return res.status(404).json({
        error: { message: 'Appointment not found', code: 'NOT_FOUND' },
      })
    }
    const allowedTransitions = VALID_TRANSITIONS[appointment.status]
    if (!allowedTransitions || !allowedTransitions.includes(targetStatus)) {
      return res.status(422).json({
        error: { message: 'Invalid status transition', code: 'INVALID_TRANSITION' },
      })
    }
    const [updated] = await db
      .update(schema.appointments)
      .set({ status: targetStatus, updatedAt: new Date() })
      .where(eq(schema.appointments.id, appointmentId))
      .returning()
    console.log('Appointment status updated', {
      appointmentId,
      organizationId,
      from: appointment.status,
      to: targetStatus,
    })
    return res.status(200).json({
      data: { id: updated.id, status: updated.status },
    })
  } catch (error) {
    console.error('Appointment status transition error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
}

router.use(requireSubscription)

router.get('/', async (req, res) => {
  try {
    const sessionData = await getSessionAndOrg(req)
    if (!sessionData) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const { organizationId } = sessionData
    const conditions = [eq(schema.appointments.organizationId, organizationId)]
    const statusFilter = req.query.status as string | undefined
    if (statusFilter && VALID_STATUSES.includes(statusFilter as AppointmentStatus)) {
      conditions.push(eq(schema.appointments.status, statusFilter as AppointmentStatus))
    }
    const fromFilter = req.query.from as string | undefined
    if (fromFilter && DATE_REGEX.test(fromFilter)) {
      conditions.push(gte(schema.appointments.startDatetime, new Date(fromFilter)))
    }
    const toFilter = req.query.to as string | undefined
    if (toFilter && DATE_REGEX.test(toFilter)) {
      const toDate = new Date(toFilter)
      toDate.setHours(23, 59, 59, 999)
      conditions.push(lte(schema.appointments.startDatetime, toDate))
    }
    const appointments = await db
      .select({
        id: schema.appointments.id,
        organizationId: schema.appointments.organizationId,
        serviceId: schema.appointments.serviceId,
        startDatetime: schema.appointments.startDatetime,
        endDatetime: schema.appointments.endDatetime,
        status: schema.appointments.status,
        customerName: schema.appointments.customerName,
        customerEmail: schema.appointments.customerEmail,
        customerPhone: schema.appointments.customerPhone,
        notes: schema.appointments.notes,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        serviceName: schema.services.name,
      })
      .from(schema.appointments)
      .innerJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(and(...conditions))
      .orderBy(schema.appointments.startDatetime)
    return res.status(200).json({ data: appointments })
  } catch (error) {
    console.error('List appointments error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/:appointmentId', async (req, res) => {
  try {
    const sessionData = await getSessionAndOrg(req)
    if (!sessionData) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const { organizationId } = sessionData
    const { appointmentId } = req.params
    const [appointment] = await db
      .select({
        id: schema.appointments.id,
        organizationId: schema.appointments.organizationId,
        serviceId: schema.appointments.serviceId,
        startDatetime: schema.appointments.startDatetime,
        endDatetime: schema.appointments.endDatetime,
        status: schema.appointments.status,
        customerName: schema.appointments.customerName,
        customerEmail: schema.appointments.customerEmail,
        customerPhone: schema.appointments.customerPhone,
        notes: schema.appointments.notes,
        createdAt: schema.appointments.createdAt,
        updatedAt: schema.appointments.updatedAt,
        serviceName: schema.services.name,
        serviceDurationMinutes: schema.services.durationMinutes,
        servicePrice: schema.services.price,
      })
      .from(schema.appointments)
      .innerJoin(schema.services, eq(schema.appointments.serviceId, schema.services.id))
      .where(and(eq(schema.appointments.id, appointmentId), eq(schema.appointments.organizationId, organizationId)))
      .limit(1)
    if (!appointment) {
      return res.status(404).json({
        error: { message: 'Appointment not found', code: 'NOT_FOUND' },
      })
    }
    return res.status(200).json({ data: appointment })
  } catch (error) {
    console.error('Get appointment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.post('/:appointmentId/confirm', (req, res) => transitionStatus(req, res, 'confirmed'))

router.post('/:appointmentId/complete', (req, res) => transitionStatus(req, res, 'completed'))

router.post('/:appointmentId/no-show', (req, res) => transitionStatus(req, res, 'no_show'))

router.post('/:appointmentId/cancel', (req, res) => transitionStatus(req, res, 'cancelled'))

export const appointmentsRoutes = router
