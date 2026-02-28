import { resolvePlanFromSubscription } from '@schedulizer/billing'
import { createDb, schema } from '@schedulizer/db'
import { EmailService } from '@schedulizer/email'
import { serverEnv } from '@schedulizer/env/server'
import { ChannelResolver, NotificationService } from '@schedulizer/notifications'
import { withMonitoring } from '@schedulizer/observability/node'
import { WhatsAppService } from '@schedulizer/whatsapp'
import { formatInTimeZone } from 'date-fns-tz'
import { and, eq, gt, inArray, isNull, lt } from 'drizzle-orm'
import { Router } from 'express'
import { requireApiKey } from '../middlewares/require-api-key.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)
const channelResolver = new ChannelResolver()
const whatsAppService = new WhatsAppService({
  phoneNumberId: serverEnv.whatsappPhoneNumberId,
  accessToken: serverEnv.whatsappAccessToken,
  apiVersion: 'v21.0',
})
const emailService = new EmailService({ apiKey: serverEnv.resendApiKey })
const notificationService = new NotificationService({ channelResolver, whatsAppService, emailService })

const REMINDER_WINDOW_START_HOURS = 23
const REMINDER_WINDOW_END_HOURS = 25
const MS_PER_HOUR = 3600000
const DATE_FORMAT = 'dd/MM/yyyy'
const TIME_FORMAT = 'HH:mm'
const SEND_REMINDERS_SCHEDULE = '*/15 * * * *'
const CHECKIN_MARGIN_MINUTES = 5
const MAX_RUNTIME_MINUTES = 10

router.use(requireApiKey)

async function processReminders() {
  const now = new Date()
  const windowStart = new Date(now.getTime() + REMINDER_WINDOW_START_HOURS * MS_PER_HOUR)
  const windowEnd = new Date(now.getTime() + REMINDER_WINDOW_END_HOURS * MS_PER_HOUR)
  const eligibleAppointments = await db
    .select()
    .from(schema.appointments)
    .where(
      and(
        inArray(schema.appointments.status, ['pending', 'confirmed']),
        gt(schema.appointments.startDatetime, windowStart),
        lt(schema.appointments.startDatetime, windowEnd),
        isNull(schema.appointments.reminderSentAt),
      ),
    )
  let sent = 0
  let failed = 0
  for (const appointment of eligibleAppointments) {
    try {
      const [organization] = await db
        .select()
        .from(schema.organizations)
        .where(eq(schema.organizations.id, appointment.organizationId))
        .limit(1)
      const [service] = await db
        .select({ name: schema.services.name })
        .from(schema.services)
        .where(eq(schema.services.id, appointment.serviceId))
        .limit(1)
      if (!organization || !service) {
        failed++
        continue
      }
      const appointmentDate = formatInTimeZone(appointment.startDatetime, organization.timezone, DATE_FORMAT)
      const appointmentTime = formatInTimeZone(appointment.startDatetime, organization.timezone, TIME_FORMAT)
      const managementUrl = `${serverEnv.frontendUrl}/booking/${organization.slug}/manage/${appointment.managementToken}`
      const managementUrlSuffix = `/${organization.slug}/manage/${appointment.managementToken}`
      const [subscription] = await db
        .select({
          stripePriceId: schema.subscriptions.stripePriceId,
          status: schema.subscriptions.status,
        })
        .from(schema.subscriptions)
        .where(eq(schema.subscriptions.organizationId, appointment.organizationId))
        .limit(1)
      const resolvedPlan = subscription
        ? resolvePlanFromSubscription({
            stripePriceId: subscription.stripePriceId,
            status: subscription.status,
          })
        : null
      const locale = (appointment.language ?? 'pt-BR') as 'pt-BR' | 'en'
      notificationService.send({
        event: 'appointment.reminder',
        organizationId: organization.id,
        recipientPhone: appointment.customerPhone,
        recipientEmail: appointment.customerEmail,
        locale,
        data: {
          customerName: appointment.customerName,
          serviceName: service.name,
          appointmentDate,
          appointmentTime,
          organizationName: organization.name,
          cancelUrl: `${managementUrl}?action=cancel`,
          rescheduleUrl: `${managementUrl}?action=reschedule`,
          cancelUrlSuffix: `${managementUrlSuffix}?action=cancel`,
          rescheduleUrlSuffix: `${managementUrlSuffix}?action=reschedule`,
        },
        planType: resolvedPlan?.type ?? 'essential',
      })
      await db
        .update(schema.appointments)
        .set({ reminderSentAt: new Date() })
        .where(eq(schema.appointments.id, appointment.id))
      sent++
    } catch (error) {
      console.error('Reminder notification failed', {
        appointmentId: appointment.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      failed++
    }
  }
  console.log('Reminders processed', { sent, failed })
  return { sent, failed }
}

router.post('/send-reminders', async (_req, res) => {
  try {
    const result = await withMonitoring(
      {
        monitorSlug: 'send-reminders',
        schedule: { type: 'crontab', value: SEND_REMINDERS_SCHEDULE },
        checkinMargin: CHECKIN_MARGIN_MINUTES,
        maxRuntime: MAX_RUNTIME_MINUTES,
      },
      processReminders,
    )
    return res.status(200).json({ data: result })
  } catch (error) {
    console.error('Send reminders error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const notificationsRoutes = router
