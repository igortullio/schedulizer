import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { UpdateOrganizationSettingsSchema } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq, ne } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../lib/auth'
import { requirePermission } from '../middlewares/require-permission.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const setActiveOrgSchema = z.object({
  organizationId: z.string().uuid(),
})

router.post('/set-active-org', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const validation = setActiveOrgSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { organizationId } = validation.data
    const result = await auth.api.setActiveOrganization({
      body: { organizationId },
      headers: fromNodeHeaders(req.headers),
    })
    if (!result) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    console.log('Active organization set', {
      userId: session.user.id,
      organizationId,
    })
    return res.status(200).json({
      data: { activeOrganizationId: organizationId },
    })
  } catch (error) {
    if (error instanceof Error && error.message.includes('not a member')) {
      return res.status(403).json({
        error: { message: 'User is not a member of this organization', code: 'FORBIDDEN' },
      })
    }
    console.error('Failed to set active organization', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/settings', async (req, res) => {
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
    const [organization] = await db
      .select({
        slug: schema.organizations.slug,
        timezone: schema.organizations.timezone,
      })
      .from(schema.organizations)
      .where(eq(schema.organizations.id, organizationId))
      .limit(1)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    return res.status(200).json({ data: organization })
  } catch (error) {
    console.error('Failed to get organization settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.patch('/settings', requirePermission('organization', 'update'), async (req, res) => {
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
    const validation = UpdateOrganizationSettingsSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { slug, timezone } = validation.data
    if (slug) {
      const [existing] = await db
        .select({ id: schema.organizations.id })
        .from(schema.organizations)
        .where(and(eq(schema.organizations.slug, slug), ne(schema.organizations.id, organizationId)))
        .limit(1)
      if (existing) {
        return res.status(409).json({
          error: { message: 'Slug already in use', code: 'SLUG_CONFLICT' },
        })
      }
    }
    const updateData: Record<string, string> = {}
    if (slug) updateData.slug = slug
    if (timezone) updateData.timezone = timezone
    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        error: { message: 'No fields to update', code: 'INVALID_REQUEST' },
      })
    }
    const [updated] = await db
      .update(schema.organizations)
      .set(updateData)
      .where(eq(schema.organizations.id, organizationId))
      .returning({
        slug: schema.organizations.slug,
        timezone: schema.organizations.timezone,
      })
    if (!updated) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    console.log('Organization settings updated', {
      organizationId,
      updatedFields: Object.keys(updateData),
    })
    return res.status(200).json({ data: updated })
  } catch (error) {
    console.error('Failed to update organization settings', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const organizationsRoutes = router
