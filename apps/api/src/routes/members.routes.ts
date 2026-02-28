import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { fromNodeHeaders } from 'better-auth/node'
import { and, eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'
import { auth } from '../lib/auth'

const membersRouter = Router()
const invitationsRouter = Router()
const db = createDb(serverEnv.databaseUrl)

const invitationIdSchema = z.object({
  id: z.string().uuid('Invalid invitation ID'),
})

membersRouter.get('/', async (req, res) => {
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
    const members = await db
      .select({
        id: schema.members.id,
        userId: schema.members.userId,
        organizationId: schema.members.organizationId,
        role: schema.members.role,
        createdAt: schema.members.createdAt,
        userName: schema.users.name,
        userEmail: schema.users.email,
        userImage: schema.users.image,
        userPhoneNumber: schema.users.phoneNumber,
      })
      .from(schema.members)
      .innerJoin(schema.users, eq(schema.members.userId, schema.users.id))
      .where(eq(schema.members.organizationId, organizationId))
    return res.status(200).json({
      data: members.map(m => ({
        id: m.id,
        userId: m.userId,
        organizationId: m.organizationId,
        role: m.role,
        createdAt: m.createdAt,
        user: {
          id: m.userId,
          name: m.userName,
          email: m.userEmail,
          image: m.userImage,
          phoneNumber: m.userPhoneNumber,
        },
      })),
    })
  } catch (error) {
    console.error('Failed to list members', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

membersRouter.post('/leave', async (req, res) => {
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
    const [member] = await db
      .select({ role: schema.members.role })
      .from(schema.members)
      .where(and(eq(schema.members.userId, session.user.id), eq(schema.members.organizationId, organizationId)))
      .limit(1)
    if (!member) {
      return res.status(404).json({
        error: { message: 'Member not found', code: 'NOT_FOUND' },
      })
    }
    if (member.role === 'owner') {
      return res.status(403).json({
        error: { message: 'Owner cannot leave organization', code: 'OWNER_CANNOT_LEAVE' },
      })
    }
    await auth.api.removeMember({
      headers: fromNodeHeaders(req.headers),
      body: { memberIdOrEmail: session.user.id, organizationId },
    })
    console.log('Member left organization', {
      userId: session.user.id,
      organizationId,
    })
    return res.status(200).json({
      data: { message: 'Successfully left organization' },
    })
  } catch (error) {
    console.error('Failed to leave organization', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

invitationsRouter.get('/:id', async (req, res) => {
  try {
    const validation = invitationIdSchema.safeParse(req.params)
    if (!validation.success) {
      return res.status(400).json({
        error: { message: 'Invalid invitation ID', code: 'INVALID_REQUEST' },
      })
    }
    const { id } = validation.data
    const [invitation] = await db
      .select({
        id: schema.invitations.id,
        email: schema.invitations.email,
        role: schema.invitations.role,
        status: schema.invitations.status,
        expiresAt: schema.invitations.expiresAt,
        organizationName: schema.organizations.name,
        inviterName: schema.users.name,
      })
      .from(schema.invitations)
      .innerJoin(schema.organizations, eq(schema.invitations.organizationId, schema.organizations.id))
      .innerJoin(schema.users, eq(schema.invitations.inviterId, schema.users.id))
      .where(eq(schema.invitations.id, id))
      .limit(1)
    if (!invitation) {
      return res.status(404).json({
        error: { message: 'Invitation not found', code: 'NOT_FOUND' },
      })
    }
    if (invitation.status !== 'pending') {
      return res.status(410).json({
        error: { message: 'Invitation is no longer valid', code: 'INVITATION_INVALID' },
      })
    }
    if (new Date(invitation.expiresAt) < new Date()) {
      return res.status(410).json({
        error: { message: 'Invitation has expired', code: 'INVITATION_EXPIRED' },
      })
    }
    return res.status(200).json({
      data: {
        id: invitation.id,
        organizationName: invitation.organizationName,
        inviterName: invitation.inviterName,
        email: invitation.email,
        role: invitation.role,
        status: invitation.status,
        expiresAt: invitation.expiresAt,
      },
    })
  } catch (error) {
    console.error('Failed to get invitation details', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const membersRoutes = membersRouter
export const invitationsRoutes = invitationsRouter
