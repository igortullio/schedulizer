import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { formatInTimeZone } from 'date-fns-tz'
import { and, eq, gt, inArray, isNull, lt } from 'drizzle-orm'
import { Router } from 'express'
import { sendReminder } from '../lib/email'
import { requireApiKey } from '../middlewares/require-api-key.middleware'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const REMINDER_WINDOW_START_HOURS = 23
const REMINDER_WINDOW_END_HOURS = 25
const MS_PER_HOUR = 3600000

router.use(requireApiKey)

router.post('/send-reminders', async (_req, res) => {
  try {
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
        const formattedDateTime = formatInTimeZone(appointment.startDatetime, organization.timezone, 'dd/MM/yyyy HH:mm')
        const managementUrl = `${serverEnv.frontendUrl}/booking/${organization.slug}/manage/${appointment.managementToken}`
        await sendReminder({
          to: appointment.customerEmail,
          customerName: appointment.customerName,
          serviceName: service.name,
          dateTime: formattedDateTime,
          organizationName: organization.name,
          managementUrl,
        })
        await db
          .update(schema.appointments)
          .set({ reminderSentAt: new Date() })
          .where(eq(schema.appointments.id, appointment.id))
        sent++
      } catch (error) {
        console.error('Reminder email failed', {
          appointmentId: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        failed++
      }
    }
    console.log('Reminders processed', { sent, failed })
    return res.status(200).json({ data: { sent, failed } })
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
