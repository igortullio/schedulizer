export type Locale = 'pt-BR' | 'en'

export enum EmailType {
  MagicLink = 'magic-link',
  BookingConfirmation = 'booking-confirmation',
  BookingCancellation = 'booking-cancellation',
  BookingReschedule = 'booking-reschedule',
  AppointmentReminder = 'appointment-reminder',
  OwnerNewBooking = 'owner-new-booking',
  OwnerCancellation = 'owner-cancellation',
  OwnerReschedule = 'owner-reschedule',
}

export interface SendEmailParams {
  to: string
  emailType: EmailType
  locale: Locale
  variables: Record<string, string>
  subject: string
}

export const DEFAULT_LOCALE: Locale = 'pt-BR'
export const SUPPORTED_LOCALES: Locale[] = ['pt-BR', 'en']
export const EMAIL_FROM = 'Schedulizer <noreply@contact.schedulizer.me>'
