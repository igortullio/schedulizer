import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { CreateTimeBlockSchema } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq, gte, lte } from 'drizzle-orm'
import { Router } from 'express'
import { auth } from '../lib/auth'
import { requireSubscription } from '../middlewares/require-subscription.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/

router.use(requireSubscription)

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
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined
    if (!from || !to || !DATE_REGEX.test(from) || !DATE_REGEX.test(to)) {
      return res.status(400).json({
        error: { message: 'Query params from and to are required (YYYY-MM-DD)', code: 'INVALID_REQUEST' },
      })
    }
    const timeBlocks = await db
      .select()
      .from(schema.timeBlocks)
      .where(
        and(
          eq(schema.timeBlocks.organizationId, organizationId),
          gte(schema.timeBlocks.date, from),
          lte(schema.timeBlocks.date, to),
        ),
      )
    return res.status(200).json({ data: timeBlocks })
  } catch (error) {
    console.error('List time blocks error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

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
    const validation = CreateTimeBlockSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { date, startTime, endTime, reason } = validation.data
    const [timeBlock] = await db
      .insert(schema.timeBlocks)
      .values({
        organizationId,
        date,
        startTime,
        endTime,
        reason: reason ?? null,
      })
      .returning()
    console.log('Time block created', { timeBlockId: timeBlock.id, organizationId })
    return res.status(201).json({ data: timeBlock })
  } catch (error) {
    console.error('Create time block error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.delete('/:timeBlockId', async (req, res) => {
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
    const { timeBlockId } = req.params
    const [existing] = await db
      .select()
      .from(schema.timeBlocks)
      .where(and(eq(schema.timeBlocks.id, timeBlockId), eq(schema.timeBlocks.organizationId, organizationId)))
      .limit(1)
    if (!existing) {
      return res.status(404).json({
        error: { message: 'Time block not found', code: 'NOT_FOUND' },
      })
    }
    await db.delete(schema.timeBlocks).where(eq(schema.timeBlocks.id, timeBlockId))
    console.log('Time block deleted', { timeBlockId, organizationId })
    return res.status(204).send()
  } catch (error) {
    console.error('Delete time block error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const timeBlocksRoutes = router
