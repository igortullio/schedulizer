import type { TemplateComponent } from '../types'

export const REMINDER_TEMPLATE_NAME = 'appointment_reminder'

export function buildReminderComponents(params: ReminderTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.appointmentDate} ${params.appointmentTime}` },
      ],
    },
  ]
}

export interface ReminderTemplateParams {
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}
