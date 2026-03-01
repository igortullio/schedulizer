import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../lib/auth'
import { requireSubscription } from '../middlewares/require-subscription.middleware'

interface UserUpdateFields {
  email?: string
  phoneNumber?: string
}

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

const UpdateUserSchema = z
  .object({
    phoneNumber: z.string().regex(E164_PATTERN, 'Invalid E.164 phone number format').optional(),
    email: z.string().email('Invalid email format').optional(),
  })
  .refine(data => data.phoneNumber !== undefined || data.email !== undefined, {
    message: 'At least one field (phoneNumber or email) must be provided',
  })

async function getSessionAndOrg(req: { headers: Record<string, string | string[] | undefined> }) {
  const session = await auth.api.getSession({
    headers: fromNodeHeaders(req.headers),
  })
  if (!session) return null
  const organizationId = session.session.activeOrganizationId
  if (!organizationId) return null
  return { session, organizationId }
}

router.use(requireSubscription)

router.patch('/:userId', async (req, res) => {
  try {
    const sessionData = await getSessionAndOrg(req)
    if (!sessionData) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const { session, organizationId } = sessionData
    const { userId } = req.params
    const validation = UpdateUserSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const isSelfEdit = session.user.id === userId
    if (!isSelfEdit) {
      const [requestingMember] = await db
        .select({ role: schema.members.role })
        .from(schema.members)
        .where(and(eq(schema.members.userId, session.user.id), eq(schema.members.organizationId, organizationId)))
        .limit(1)
      if (!requestingMember || (requestingMember.role !== 'owner' && requestingMember.role !== 'admin')) {
        return res.status(403).json({
          error: { message: 'Forbidden', code: 'FORBIDDEN' },
        })
      }
    }
    const [targetMember] = await db
      .select({ userId: schema.members.userId })
      .from(schema.members)
      .where(and(eq(schema.members.userId, userId), eq(schema.members.organizationId, organizationId)))
      .limit(1)
    if (!targetMember) {
      return res.status(404).json({
        error: { message: 'User not found', code: 'NOT_FOUND' },
      })
    }
    const updateData: UserUpdateFields = {}
    if (validation.data.phoneNumber !== undefined) {
      updateData.phoneNumber = validation.data.phoneNumber
    }
    if (validation.data.email !== undefined) {
      updateData.email = validation.data.email
    }
    try {
      const [updatedUser] = await db.update(schema.users).set(updateData).where(eq(schema.users.id, userId)).returning({
        id: schema.users.id,
        email: schema.users.email,
        phoneNumber: schema.users.phoneNumber,
      })
      console.log('User updated', {
        targetUserId: userId,
        updatedBy: session.user.id,
        fields: Object.keys(updateData),
      })
      return res.status(200).json({
        data: {
          id: updatedUser.id,
          phoneNumber: updatedUser.phoneNumber,
          email: updatedUser.email,
        },
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      if (errorMessage.includes('email') || errorMessage.includes('UNIQUE') || errorMessage.includes('unique')) {
        if (updateData.email) {
          return res.status(409).json({
            error: { message: 'Email already in use', code: 'DUPLICATE_EMAIL' },
          })
        }
        return res.status(409).json({
          error: { message: 'Phone number already in use', code: 'DUPLICATE_PHONE' },
        })
      }
      throw error
    }
  } catch (error) {
    console.error('User update failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const userRoutes = router
