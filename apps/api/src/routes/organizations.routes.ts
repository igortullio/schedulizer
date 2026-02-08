import { fromNodeHeaders } from 'better-auth/node'
import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../lib/auth'

const router = Router()

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

export const organizationsRoutes = router
