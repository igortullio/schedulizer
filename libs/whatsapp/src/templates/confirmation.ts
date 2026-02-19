import type { TemplateComponent } from '../types'

export const CONFIRMATION_TEMPLATE_NAME = 'appointment_confirmation'

export function buildConfirmationComponents(params: ConfirmationTemplateParams): TemplateComponent[] {
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

export interface ConfirmationTemplateParams {
  customerName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}
