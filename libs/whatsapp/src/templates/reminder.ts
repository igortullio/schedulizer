import type { TemplateComponent } from '../types'

export const REMINDER_TEMPLATE_NAME = 'appointment_reminder'

export function buildReminderComponents(params: ReminderTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.organizationName },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.appointmentDate} ${params.appointmentTime}` },
      ],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: params.rescheduleUrlSuffix }],
    },
    {
      type: 'button',
      sub_type: 'url',
      index: 1,
      parameters: [{ type: 'text', text: params.cancelUrlSuffix }],
    },
  ]
}

export interface ReminderTemplateParams {
  customerName: string
  organizationName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  rescheduleUrlSuffix: string
  cancelUrlSuffix: string
}
