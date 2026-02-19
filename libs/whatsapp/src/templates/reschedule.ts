import type { TemplateComponent } from '../types'

export const RESCHEDULE_TEMPLATE_NAME = 'appointment_reschedule'

export function buildRescheduleComponents(params: RescheduleTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.oldDate} ${params.oldTime}` },
        { type: 'text', text: `${params.newDate} ${params.newTime}` },
      ],
    },
  ]
}

export interface RescheduleTemplateParams {
  customerName: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}
