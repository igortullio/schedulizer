import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { CreateServiceSchema, UpdateServiceSchema } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { and, count, eq, gt, ne } from 'drizzle-orm'
import { Router } from 'express'
import { auth } from '../lib/auth'
import { requireSubscription } from '../middlewares/require-subscription.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const CENTS_PER_UNIT = 100

function priceToCents(price: string): number {
  return Math.round(Number.parseFloat(price) * CENTS_PER_UNIT)
}

function centsToPrice(cents: number | null): string | null {
  if (cents === null) return null
  return (cents / CENTS_PER_UNIT).toFixed(2)
}

router.use(requireSubscription)

router.post('/', async (req, res) => {
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
    const planLimits = req.subscription?.plan.limits
    if (planLimits && Number.isFinite(planLimits.maxServices)) {
      const [serviceCount] = await db
        .select({ value: count() })
        .from(schema.services)
        .where(eq(schema.services.organizationId, organizationId))
      const currentCount = serviceCount?.value ?? 0
      if (currentCount >= planLimits.maxServices) {
        console.log('Plan limit enforcement triggered', {
          organizationId,
          resource: 'services',
          planType: req.subscription?.plan.type,
          currentCount,
          limit: planLimits.maxServices,
          action: 'blocked',
        })
        return res.status(403).json({
          error: {
            message: 'Plan limit exceeded for services',
            code: 'PLAN_LIMIT_EXCEEDED',
            resource: 'services',
            current: currentCount,
            limit: planLimits.maxServices,
            upgradeRequired: true,
          },
        })
      }
    }
    const validation = CreateServiceSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { name, description, duration, price, active } = validation.data
    const [service] = await db
      .insert(schema.services)
      .values({
        organizationId,
        name,
        description: description ?? null,
        durationMinutes: duration,
        price: priceToCents(price),
        active,
      })
      .returning()
    console.log('Service created', { serviceId: service.id, organizationId })
    return res.status(201).json({
      data: {
        ...service,
        price: centsToPrice(service.price),
      },
    })
  } catch (error) {
    console.error('Create service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/', async (req, res) => {
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
    const conditions = [eq(schema.services.organizationId, organizationId)]
    const activeFilter = req.query.active
    if (activeFilter === 'true') {
      conditions.push(eq(schema.services.active, true))
    } else if (activeFilter === 'false') {
      conditions.push(eq(schema.services.active, false))
    }
    const services = await db
      .select()
      .from(schema.services)
      .where(and(...conditions))
    return res.status(200).json({
      data: services.map(s => ({ ...s, price: centsToPrice(s.price) })),
    })
  } catch (error) {
    console.error('List services error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/:serviceId', async (req, res) => {
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
    return res.status(200).json({
      data: { ...service, price: centsToPrice(service.price) },
    })
  } catch (error) {
    console.error('Get service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.put('/:serviceId', async (req, res) => {
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
    const validation = UpdateServiceSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { serviceId } = req.params
    const [existing] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.organizationId, organizationId)))
      .limit(1)
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const { name, description, duration, price, active } = validation.data
    const updateData: Record<string, unknown> = { updatedAt: new Date() }
    if (name !== undefined) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (duration !== undefined) updateData.durationMinutes = duration
    if (price !== undefined) updateData.price = priceToCents(price)
    if (active !== undefined) updateData.active = active
    const [updated] = await db
      .update(schema.services)
      .set(updateData)
      .where(eq(schema.services.id, serviceId))
      .returning()
    console.log('Service updated', { serviceId, organizationId })
    return res.status(200).json({
      data: { ...updated, price: centsToPrice(updated.price) },
    })
  } catch (error) {
    console.error('Update service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.delete('/:serviceId', async (req, res) => {
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
    const [existing] = await db
      .select()
      .from(schema.services)
      .where(and(eq(schema.services.id, serviceId), eq(schema.services.organizationId, organizationId)))
      .limit(1)
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const futureAppointments = await db
      .select({ id: schema.appointments.id })
      .from(schema.appointments)
      .where(
        and(
          eq(schema.appointments.serviceId, serviceId),
          gt(schema.appointments.startDatetime, new Date()),
          ne(schema.appointments.status, 'cancelled'),
        ),
      )
      .limit(1)
    if (futureAppointments.length > 0) {
      return res.status(422).json({
        error: { message: 'Service has future appointments', code: 'HAS_FUTURE_APPOINTMENTS' },
      })
    }
    await db.delete(schema.services).where(eq(schema.services.id, serviceId))
    console.log('Service deleted', { serviceId, organizationId })
    return res.status(204).send()
  } catch (error) {
    console.error('Delete service error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const servicesRoutes = router
