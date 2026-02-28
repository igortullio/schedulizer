import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import type { AppointmentDeps, SessionDb, WebhookPayload } from '@schedulizer/whatsapp'
import {
  ChatbotEngine,
  SessionRepository,
  verifyWebhookSignature,
  WebhookHandler,
  WhatsAppService,
} from '@schedulizer/whatsapp'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import { Router, raw } from 'express'
import { z } from 'zod'
import { calculateAvailableSlots } from '../lib/slot-calculator'

const db = createDb(serverEnv.databaseUrl)

const whatsAppService = new WhatsAppService({
  phoneNumberId: serverEnv.whatsappPhoneNumberId,
  accessToken: serverEnv.whatsappAccessToken,
  apiVersion: 'v21.0',
})

const MS_PER_MINUTE = 60_000

function createSessionDb(): SessionDb {
  return {
    async findActiveByPhone(phoneNumber, organizationId, ttlThreshold) {
      const [row] = await db
        .select()
        .from(schema.whatsappSessions)
        .where(
          and(
            eq(schema.whatsappSessions.phoneNumber, phoneNumber),
            eq(schema.whatsappSessions.organizationId, organizationId),
            gt(schema.whatsappSessions.updatedAt, ttlThreshold),
          ),
        )
        .limit(1)
      return row ?? undefined
    },
    async create(params) {
      const [row] = await db.insert(schema.whatsappSessions).values(params).returning()
      return row
    },
    async update(sessionId, params) {
      const [row] = await db
        .update(schema.whatsappSessions)
        .set({ currentStep: params.currentStep, context: params.context, updatedAt: new Date() })
        .where(eq(schema.whatsappSessions.id, sessionId))
        .returning()
      return row
    },
    async deleteExpired(ttlThreshold) {
      await db.delete(schema.whatsappSessions).where(lt(schema.whatsappSessions.updatedAt, ttlThreshold))
    },
  }
}

function createAppointmentDeps(): AppointmentDeps {
  return {
    async listServices(organizationId) {
      const services = await db
        .select({ id: schema.services.id, name: schema.services.name })
        .from(schema.services)
        .where(and(eq(schema.services.organizationId, organizationId), eq(schema.services.active, true)))
      return services
    },
    async listAvailableSlots(params) {
      const slots = await calculateAvailableSlots(
        { serviceId: params.serviceId, date: params.date, organizationId: params.organizationId },
        db,
      )
      return slots.map(s => ({ startTime: s.startTime, endTime: s.endTime }))
    },
    async createAppointment(params) {
      const [service] = await db
        .select({ durationMinutes: schema.services.durationMinutes })
        .from(schema.services)
        .where(eq(schema.services.id, params.serviceId))
        .limit(1)
      if (!service) throw new Error('Service not found')
      const startDatetime = new Date(params.startTime)
      const endDatetime = new Date(startDatetime.getTime() + service.durationMinutes * MS_PER_MINUTE)
      const [created] = await db.transaction(async tx => {
        const conflicting = await tx
          .select({ id: schema.appointments.id })
          .from(schema.appointments)
          .where(
            and(
              eq(schema.appointments.serviceId, params.serviceId),
              ne(schema.appointments.status, 'cancelled'),
              lt(schema.appointments.startDatetime, endDatetime),
              gt(schema.appointments.endDatetime, startDatetime),
            ),
          )
          .limit(1)
        if (conflicting.length > 0) throw new Error('Slot no longer available')
        return tx
          .insert(schema.appointments)
          .values({
            organizationId: params.organizationId,
            serviceId: params.serviceId,
            startDatetime,
            endDatetime,
            status: 'pending',
            customerName: 'WhatsApp Customer',
            customerEmail: '',
            customerPhone: params.customerPhone,
          })
          .returning({ id: schema.appointments.id })
      })
      return { id: created.id }
    },
  }
}

const sessionRepository = new SessionRepository(createSessionDb())
const appointmentDeps = createAppointmentDeps()

function createWebhookHandler(organizationId: string): WebhookHandler {
  const chatbotEngine = new ChatbotEngine({
    sessionRepository,
    whatsAppService,
    appointmentDeps,
  })
  return new WebhookHandler({
    sessionRepository,
    chatbotEngine,
    whatsAppService,
    defaultOrganizationId: organizationId,
  })
}

async function resolveOrganizationId(): Promise<string> {
  const [org] = await db.select({ id: schema.organizations.id }).from(schema.organizations).limit(1)
  return org?.id ?? ''
}

const verifyQuerySchema = z.object({
  'hub.mode': z.literal('subscribe'),
  'hub.verify_token': z.string().min(1),
  'hub.challenge': z.string().min(1),
})

export const whatsappWebhookRouter = Router()

whatsappWebhookRouter.get('/', (req, res) => {
  const result = verifyQuerySchema.safeParse(req.query)
  if (!result.success) {
    return res.status(400).json({ error: 'Invalid query parameters' })
  }
  if (result.data['hub.verify_token'] !== serverEnv.whatsappVerifyToken) {
    console.error('WhatsApp webhook verification failed', {
      reason: 'verify_token_mismatch',
    })
    return res.status(403).json({ error: 'Forbidden' })
  }
  return res.status(200).send(result.data['hub.challenge'])
})

whatsappWebhookRouter.post('/', raw({ type: 'application/json' }), (req, res) => {
  const rawBody = req.body as Buffer
  const signature = req.headers['x-hub-signature-256']
  if (!signature || typeof signature !== 'string') {
    return res.status(401).json({ error: 'Missing signature' })
  }
  const isValid = verifyWebhookSignature(rawBody.toString('utf-8'), signature, serverEnv.whatsappAppSecret)
  if (!isValid) {
    console.error('WhatsApp webhook signature invalid')
    return res.status(401).json({ error: 'Invalid signature' })
  }
  const payload = JSON.parse(rawBody.toString('utf-8')) as WebhookPayload
  resolveOrganizationId()
    .then(organizationId => {
      const handler = createWebhookHandler(organizationId)
      return handler.process(payload)
    })
    .catch(error => {
      console.error('WhatsApp webhook processing failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    })
  return res.status(200).json({ data: 'ok' })
})
