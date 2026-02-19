export type NotificationEvent =
  | 'appointment.confirmed'
  | 'appointment.cancelled'
  | 'appointment.rescheduled'
  | 'appointment.reminder'

export type NotificationChannel = 'whatsapp' | 'email'

export interface SendNotificationParams {
  event: NotificationEvent
  organizationId: string
  recipientPhone?: string
  recipientEmail?: string
  locale: 'pt-BR' | 'en'
  data: Record<string, string>
}

export interface ResolveChannelParams {
  recipientPhone?: string
  organizationWhatsAppEnabled: boolean
  planType: string
}
