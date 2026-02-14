import { EmailType, type Locale } from '../lib/types'

type TemplateIdMap = Record<EmailType, Record<Locale, string>>

export function loadTemplateIds(): TemplateIdMap {
  return {
    [EmailType.MagicLink]: {
      'pt-BR': process.env.RESEND_TPL_MAGIC_LINK_PT_BR ?? '',
      en: process.env.RESEND_TPL_MAGIC_LINK_EN ?? '',
    },
    [EmailType.BookingConfirmation]: {
      'pt-BR': process.env.RESEND_TPL_BOOKING_CONFIRMATION_PT_BR ?? '',
      en: process.env.RESEND_TPL_BOOKING_CONFIRMATION_EN ?? '',
    },
    [EmailType.BookingCancellation]: {
      'pt-BR': process.env.RESEND_TPL_BOOKING_CANCELLATION_PT_BR ?? '',
      en: process.env.RESEND_TPL_BOOKING_CANCELLATION_EN ?? '',
    },
    [EmailType.BookingReschedule]: {
      'pt-BR': process.env.RESEND_TPL_BOOKING_RESCHEDULE_PT_BR ?? '',
      en: process.env.RESEND_TPL_BOOKING_RESCHEDULE_EN ?? '',
    },
    [EmailType.AppointmentReminder]: {
      'pt-BR': process.env.RESEND_TPL_APPOINTMENT_REMINDER_PT_BR ?? '',
      en: process.env.RESEND_TPL_APPOINTMENT_REMINDER_EN ?? '',
    },
    [EmailType.OwnerNewBooking]: {
      'pt-BR': process.env.RESEND_TPL_OWNER_NEW_BOOKING_PT_BR ?? '',
      en: process.env.RESEND_TPL_OWNER_NEW_BOOKING_EN ?? '',
    },
    [EmailType.OwnerCancellation]: {
      'pt-BR': process.env.RESEND_TPL_OWNER_CANCELLATION_PT_BR ?? '',
      en: process.env.RESEND_TPL_OWNER_CANCELLATION_EN ?? '',
    },
    [EmailType.OwnerReschedule]: {
      'pt-BR': process.env.RESEND_TPL_OWNER_RESCHEDULE_PT_BR ?? '',
      en: process.env.RESEND_TPL_OWNER_RESCHEDULE_EN ?? '',
    },
  }
}
