export { EmailService } from './lib/email-service'
export { extractLocale } from './lib/extract-locale'
export { TemplateRegistry } from './lib/template-registry'
export type {
  AppointmentReminderParams,
  BookingCancellationParams,
  BookingConfirmationParams,
  BookingRescheduleParams,
  InvitationParams,
  MagicLinkParams,
  OwnerCancellationParams,
  OwnerNewBookingParams,
  OwnerRescheduleParams,
} from './lib/template-variables'
export type { Locale, SendEmailParams } from './lib/types'
export { DEFAULT_LOCALE, EMAIL_FROM, EmailType, SUPPORTED_LOCALES } from './lib/types'
