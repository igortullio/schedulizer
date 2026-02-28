import type { TemplateComponent } from '../types'

export const CANCELLATION_TEMPLATE_NAME = 'appointment_cancellation'

export function buildCancellationComponents(params: CancellationTemplateParams): TemplateComponent[] {
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
  ]
}

export interface CancellationTemplateParams {
  customerName: string
  organizationName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}
