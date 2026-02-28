import type { TemplateComponent } from '../types'

export const CONFIRMATION_TEMPLATE_NAME = 'appointment_confirmation'

export function buildConfirmationComponents(params: ConfirmationTemplateParams): TemplateComponent[] {
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

export interface ConfirmationTemplateParams {
  customerName: string
  organizationName: string
  serviceName: string
  appointmentDate: string
  appointmentTime: string
  rescheduleUrlSuffix: string
  cancelUrlSuffix: string
}
