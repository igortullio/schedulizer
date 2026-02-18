import { createDb, schema } from '@schedulizer/db'
import { EmailService, extractLocale, type Locale } from '@schedulizer/email'
import { serverEnv } from '@schedulizer/env/server'
import { CreateAppointmentSchema, RescheduleAppointmentSchema } from '@schedulizer/shared-types'
import { formatInTimeZone } from 'date-fns-tz'
import { and, eq, gt, lt, ne } from 'drizzle-orm'
import { Router } from 'express'
import { calculateAvailableSlots } from '../lib/slot-calculator'

const router = Router()
const db = createDb(serverEnv.databaseUrl)
const emailService = new EmailService({ apiKey: serverEnv.resendApiKey })

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/
const MAX_FUTURE_DAYS = 60
const MS_PER_MINUTE = 60000
const CENTS_PER_UNIT = 100
const DATE_FORMAT = 'dd/MM/yyyy'
const TIME_FORMAT = 'HH:mm'
const CANCELLABLE_STATUSES = ['pending', 'confirmed']

function formatDateToYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function centsToPrice(cents: number | null): string | null {
  if (cents === null) return null
  return (cents / CENTS_PER_UNIT).toFixed(2)
}

function formatDateInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, DATE_FORMAT)
}

function formatTimeInTimezone(date: Date, timezone: string): string {
  return formatInTimeZone(date, timezone, TIME_FORMAT)
}

function buildManagementUrl(slug: string, token: string): string {
  return `${serverEnv.frontendUrl}/booking/${slug}/manage/${token}`
}

async function getOrganizationBySlug(slug: string) {
  const [organization] = await db
    .select()
    .from(schema.organizations)
    .where(eq(schema.organizations.slug, slug))
    .limit(1)
  return organization ?? null
}

async function getOrganizationOwnerEmail(organizationId: string): Promise<string | null> {
  const [ownerMember] = await db
    .select({ userId: schema.members.userId })
    .from(schema.members)
    .where(and(eq(schema.members.organizationId, organizationId), eq(schema.members.role, 'owner')))
    .limit(1)
  if (!ownerMember) return null
  const [user] = await db
    .select({ email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, ownerMember.userId))
    .limit(1)
  return user?.email ?? null
}

router.get('/:slug', async (req, res) => {
  try {
    const { slug } = req.params
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const services = await db
      .select({
        id: schema.services.id,
        name: schema.services.name,
        description: schema.services.description,
        durationMinutes: schema.services.durationMinutes,
        price: schema.services.price,
      })
      .from(schema.services)
      .where(and(eq(schema.services.organizationId, organization.id), eq(schema.services.active, true)))
    return res.status(200).json({
      data: {
        organizationName: organization.name,
        slug: organization.slug,
        services: services.map(s => ({ ...s, price: centsToPrice(s.price) })),
      },
    })
  } catch (error) {
    console.error('Get booking page error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/:slug/services/:serviceId/slots', async (req, res) => {
  try {
    const { slug, serviceId } = req.params
    const dateParam = req.query.date as string | undefined
    if (!dateParam || !DATE_REGEX.test(dateParam)) {
      return res.status(400).json({
        error: { message: 'Query param date is required (YYYY-MM-DD)', code: 'INVALID_REQUEST' },
      })
    }
    const todayStr = formatDateToYmd(new Date())
    if (dateParam < todayStr) {
      return res.status(400).json({
        error: { message: 'Date cannot be in the past', code: 'INVALID_REQUEST' },
      })
    }
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + MAX_FUTURE_DAYS)
    if (dateParam > formatDateToYmd(maxDate)) {
      return res.status(400).json({
        error: { message: 'Date cannot be more than 60 days in the future', code: 'INVALID_REQUEST' },
      })
    }
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const [service] = await db
      .select()
      .from(schema.services)
      .where(
        and(
          eq(schema.services.id, serviceId),
          eq(schema.services.organizationId, organization.id),
          eq(schema.services.active, true),
        ),
      )
      .limit(1)
    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const slots = await calculateAvailableSlots({ serviceId, date: dateParam, organizationId: organization.id }, db)
    return res.status(200).json({ data: { slots } })
  } catch (error) {
    console.error('Get booking slots error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.post('/:slug/appointments', async (req, res) => {
  try {
    const { slug } = req.params
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const validation = CreateAppointmentSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { serviceId, startTime, customerName, customerEmail, customerPhone } = validation.data
    const [service] = await db
      .select()
      .from(schema.services)
      .where(
        and(
          eq(schema.services.id, serviceId),
          eq(schema.services.organizationId, organization.id),
          eq(schema.services.active, true),
        ),
      )
      .limit(1)
    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const startDatetime = new Date(startTime)
    if (startDatetime < new Date()) {
      return res.status(400).json({
        error: { message: 'Cannot book appointment in the past', code: 'PAST_APPOINTMENT' },
      })
    }
    const endDatetime = new Date(startDatetime.getTime() + service.durationMinutes * MS_PER_MINUTE)
    const locale = extractLocale(req.headers['accept-language'] as string | null)
    const txResult = await db.transaction(async tx => {
      const conflicting = await tx
        .select({ id: schema.appointments.id })
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.serviceId, serviceId),
            ne(schema.appointments.status, 'cancelled'),
            lt(schema.appointments.startDatetime, endDatetime),
            gt(schema.appointments.endDatetime, startDatetime),
          ),
        )
        .limit(1)
      if (conflicting.length > 0) return { conflict: true as const }
      const [created] = await tx
        .insert(schema.appointments)
        .values({
          organizationId: organization.id,
          serviceId,
          startDatetime,
          endDatetime,
          status: 'pending',
          customerName,
          customerEmail,
          customerPhone,
          language: locale,
        })
        .returning()
      return { conflict: false as const, appointment: created }
    })
    if (txResult.conflict) {
      console.log('Slot conflict detected', { serviceId, requestedSlot: startTime })
      return res.status(409).json({
        error: { message: 'Slot no longer available', code: 'SLOT_CONFLICT' },
      })
    }
    const appointment = txResult.appointment
    console.log('Appointment created', {
      appointmentId: appointment.id,
      organizationId: organization.id,
      serviceId,
      startDatetime: startDatetime.toISOString(),
    })
    const managementUrl = buildManagementUrl(slug, appointment.managementToken)
    const appointmentDate = formatDateInTimezone(startDatetime, organization.timezone)
    const appointmentTime = formatTimeInTimezone(startDatetime, organization.timezone)
    emailService
      .sendBookingConfirmation({
        to: customerEmail,
        locale,
        customerName,
        serviceName: service.name,
        appointmentDate,
        appointmentTime,
        organizationName: organization.name,
        cancelUrl: `${managementUrl}?action=cancel`,
        rescheduleUrl: `${managementUrl}?action=reschedule`,
      })
      .catch(error => {
        console.error('Confirmation email failed', {
          appointmentId: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    const ownerEmail = await getOrganizationOwnerEmail(organization.id)
    if (ownerEmail) {
      emailService
        .sendOwnerNewBooking({
          to: ownerEmail,
          locale: organization.language as Locale,
          customerName,
          customerEmail,
          serviceName: service.name,
          appointmentDate,
          appointmentTime,
        })
        .catch(error => {
          console.error('Owner notification email failed', {
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
    }
    return res.status(201).json({
      data: {
        id: appointment.id,
        startDatetime: appointment.startDatetime,
        endDatetime: appointment.endDatetime,
        status: appointment.status,
        managementToken: appointment.managementToken,
      },
    })
  } catch (error) {
    console.error('Create appointment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/:slug/manage/:token', async (req, res) => {
  try {
    const { slug, token } = req.params
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const [appointment] = await db
      .select()
      .from(schema.appointments)
      .where(
        and(eq(schema.appointments.managementToken, token), eq(schema.appointments.organizationId, organization.id)),
      )
      .limit(1)
    if (!appointment) {
      return res.status(404).json({
        error: { message: 'Appointment not found', code: 'NOT_FOUND' },
      })
    }
    const [service] = await db
      .select({ id: schema.services.id, name: schema.services.name })
      .from(schema.services)
      .where(eq(schema.services.id, appointment.serviceId))
      .limit(1)
    return res.status(200).json({
      data: {
        id: appointment.id,
        serviceId: service?.id ?? appointment.serviceId,
        serviceName: service?.name ?? 'Unknown',
        startDatetime: appointment.startDatetime,
        endDatetime: appointment.endDatetime,
        status: appointment.status,
        customerName: appointment.customerName,
      },
    })
  } catch (error) {
    console.error('Get managed appointment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.post('/:slug/manage/:token/cancel', async (req, res) => {
  try {
    const { slug, token } = req.params
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const [appointment] = await db
      .select()
      .from(schema.appointments)
      .where(
        and(eq(schema.appointments.managementToken, token), eq(schema.appointments.organizationId, organization.id)),
      )
      .limit(1)
    if (!appointment) {
      return res.status(404).json({
        error: { message: 'Appointment not found', code: 'NOT_FOUND' },
      })
    }
    if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
      return res.status(422).json({
        error: { message: 'Appointment cannot be cancelled', code: 'NOT_CANCELLABLE' },
      })
    }
    if (appointment.startDatetime < new Date()) {
      return res.status(422).json({
        error: { message: 'Cannot cancel past appointment', code: 'PAST_APPOINTMENT' },
      })
    }
    const [updated] = await db
      .update(schema.appointments)
      .set({ status: 'cancelled', updatedAt: new Date() })
      .where(eq(schema.appointments.id, appointment.id))
      .returning()
    console.log('Appointment cancelled', {
      appointmentId: appointment.id,
      organizationId: organization.id,
    })
    const [service] = await db
      .select({ name: schema.services.name })
      .from(schema.services)
      .where(eq(schema.services.id, appointment.serviceId))
      .limit(1)
    const cancelDate = formatDateInTimezone(appointment.startDatetime, organization.timezone)
    const cancelTime = formatTimeInTimezone(appointment.startDatetime, organization.timezone)
    const cancelLocale = (appointment.language ?? 'pt-BR') as Locale
    emailService
      .sendBookingCancellation({
        to: appointment.customerEmail,
        locale: cancelLocale,
        customerName: appointment.customerName,
        serviceName: service?.name ?? 'Unknown',
        appointmentDate: cancelDate,
        appointmentTime: cancelTime,
        organizationName: organization.name,
      })
      .catch(error => {
        console.error('Cancellation email failed', {
          appointmentId: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    const ownerEmail = await getOrganizationOwnerEmail(organization.id)
    if (ownerEmail) {
      emailService
        .sendOwnerCancellation({
          to: ownerEmail,
          locale: organization.language as Locale,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          serviceName: service?.name ?? 'Unknown',
          appointmentDate: cancelDate,
          appointmentTime: cancelTime,
        })
        .catch(error => {
          console.error('Owner cancellation notification failed', {
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
    }
    return res.status(200).json({
      data: { id: updated.id, status: updated.status },
    })
  } catch (error) {
    console.error('Cancel appointment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.post('/:slug/manage/:token/reschedule', async (req, res) => {
  try {
    const { slug, token } = req.params
    const organization = await getOrganizationBySlug(slug)
    if (!organization) {
      return res.status(404).json({
        error: { message: 'Organization not found', code: 'NOT_FOUND' },
      })
    }
    const [appointment] = await db
      .select()
      .from(schema.appointments)
      .where(
        and(eq(schema.appointments.managementToken, token), eq(schema.appointments.organizationId, organization.id)),
      )
      .limit(1)
    if (!appointment) {
      return res.status(404).json({
        error: { message: 'Appointment not found', code: 'NOT_FOUND' },
      })
    }
    if (!CANCELLABLE_STATUSES.includes(appointment.status)) {
      return res.status(422).json({
        error: { message: 'Appointment cannot be rescheduled', code: 'NOT_RESCHEDULABLE' },
      })
    }
    if (appointment.startDatetime < new Date()) {
      return res.status(422).json({
        error: { message: 'Cannot reschedule past appointment', code: 'PAST_APPOINTMENT' },
      })
    }
    const validation = RescheduleAppointmentSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const [service] = await db
      .select()
      .from(schema.services)
      .where(eq(schema.services.id, appointment.serviceId))
      .limit(1)
    if (!service) {
      return res.status(404).json({
        error: { message: 'Service not found', code: 'NOT_FOUND' },
      })
    }
    const newStartDatetime = new Date(validation.data.startTime)
    if (newStartDatetime < new Date()) {
      return res.status(400).json({
        error: { message: 'Cannot reschedule to a past time', code: 'PAST_APPOINTMENT' },
      })
    }
    const newEndDatetime = new Date(newStartDatetime.getTime() + service.durationMinutes * MS_PER_MINUTE)
    const oldDate = formatDateInTimezone(appointment.startDatetime, organization.timezone)
    const oldTime = formatTimeInTimezone(appointment.startDatetime, organization.timezone)
    const txResult = await db.transaction(async tx => {
      const conflicting = await tx
        .select({ id: schema.appointments.id })
        .from(schema.appointments)
        .where(
          and(
            eq(schema.appointments.serviceId, appointment.serviceId),
            ne(schema.appointments.status, 'cancelled'),
            ne(schema.appointments.id, appointment.id),
            lt(schema.appointments.startDatetime, newEndDatetime),
            gt(schema.appointments.endDatetime, newStartDatetime),
          ),
        )
        .limit(1)
      if (conflicting.length > 0) return { conflict: true as const }
      const [rescheduled] = await tx
        .update(schema.appointments)
        .set({
          startDatetime: newStartDatetime,
          endDatetime: newEndDatetime,
          reminderSentAt: null,
          updatedAt: new Date(),
        })
        .where(eq(schema.appointments.id, appointment.id))
        .returning()
      return { conflict: false as const, appointment: rescheduled }
    })
    if (txResult.conflict) {
      return res.status(409).json({
        error: { message: 'Slot no longer available', code: 'SLOT_CONFLICT' },
      })
    }
    const updated = txResult.appointment
    console.log('Appointment rescheduled', {
      appointmentId: appointment.id,
      organizationId: organization.id,
      newStartDatetime: newStartDatetime.toISOString(),
    })
    const newDate = formatDateInTimezone(newStartDatetime, organization.timezone)
    const newTime = formatTimeInTimezone(newStartDatetime, organization.timezone)
    const managementUrl = buildManagementUrl(slug, appointment.managementToken)
    const rescheduleLocale = (appointment.language ?? 'pt-BR') as Locale
    emailService
      .sendBookingReschedule({
        to: appointment.customerEmail,
        locale: rescheduleLocale,
        customerName: appointment.customerName,
        serviceName: service.name,
        oldDate,
        oldTime,
        newDate,
        newTime,
        organizationName: organization.name,
        cancelUrl: `${managementUrl}?action=cancel`,
        rescheduleUrl: `${managementUrl}?action=reschedule`,
      })
      .catch(error => {
        console.error('Reschedule email failed', {
          appointmentId: appointment.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
    const ownerEmail = await getOrganizationOwnerEmail(organization.id)
    if (ownerEmail) {
      emailService
        .sendOwnerReschedule({
          to: ownerEmail,
          locale: organization.language as Locale,
          customerName: appointment.customerName,
          customerEmail: appointment.customerEmail,
          serviceName: service.name,
          oldDate,
          oldTime,
          newDate,
          newTime,
        })
        .catch(error => {
          console.error('Owner reschedule notification failed', {
            appointmentId: appointment.id,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
    }
    return res.status(200).json({
      data: {
        id: updated.id,
        startDatetime: updated.startDatetime,
        endDatetime: updated.endDatetime,
        status: updated.status,
      },
    })
  } catch (error) {
    console.error('Reschedule appointment error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const bookingRoutes = router
