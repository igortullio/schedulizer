import type { TemplateComponent } from '../types'

export const RESCHEDULE_TEMPLATE_NAME = 'appointment_reschedule'

export function buildRescheduleComponents(params: RescheduleTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.organizationName },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.oldDate} ${params.oldTime}` },
        { type: 'text', text: `${params.newDate} ${params.newTime}` },
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

export interface RescheduleTemplateParams {
  customerName: string
  organizationName: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
  rescheduleUrlSuffix: string
  cancelUrlSuffix: string
}
