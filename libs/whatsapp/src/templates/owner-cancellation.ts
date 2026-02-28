import type { TemplateComponent } from '../types'

export const OWNER_CANCELLATION_TEMPLATE_NAME = 'owner_cancellation'

export function buildOwnerCancellationComponents(params: OwnerCancellationTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.organizationName },
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.customerEmail },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.appointmentDate} ${params.appointmentTime}` },
      ],
    },
  ]
}

export interface OwnerCancellationTemplateParams {
  organizationName: string
  customerName: string
  customerEmail: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
}
