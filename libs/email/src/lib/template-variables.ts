import type { Locale } from './types'

export interface MagicLinkParams {
  to: string
  locale: Locale
  magicLinkUrl: string
}

export interface BookingConfirmationParams {
  to: string
  locale: Locale
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  organizationName: string
  cancelUrl: string
  rescheduleUrl: string
}

export interface BookingCancellationParams {
  to: string
  locale: Locale
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  organizationName: string
}

export interface BookingRescheduleParams {
  to: string
  locale: Locale
  customerName: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  organizationName: string
  cancelUrl: string
  rescheduleUrl: string
}

export interface AppointmentReminderParams {
  to: string
  locale: Locale
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  organizationName: string
  cancelUrl: string
  rescheduleUrl: string
}

export interface OwnerNewBookingParams {
  to: string
  locale: Locale
  customerName: string
  customerEmail: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}

export interface OwnerCancellationParams {
  to: string
  locale: Locale
  customerName: string
  customerEmail: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}

export interface OwnerRescheduleParams {
  to: string
  locale: Locale
  customerName: string
  customerEmail: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}
