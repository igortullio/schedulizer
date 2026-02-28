import type { TemplateComponent } from '../types'

export const OWNER_RESCHEDULE_TEMPLATE_NAME = 'owner_reschedule'

export function buildOwnerRescheduleComponents(params: OwnerRescheduleTemplateParams): TemplateComponent[] {
  return [
    {
      type: 'body',
      parameters: [
        { type: 'text', text: params.organizationName },
        { type: 'text', text: params.customerName },
        { type: 'text', text: params.customerEmail },
        { type: 'text', text: params.serviceName },
        { type: 'text', text: `${params.oldDate} ${params.oldTime}` },
        { type: 'text', text: `${params.newDate} ${params.newTime}` },
      ],
    },
  ]
}

export interface OwnerRescheduleTemplateParams {
  organizationName: string
  customerName: string
  customerEmail: string
  serviceName: string
  oldDate: string
  oldTime: string
  newDate: string
  newTime: string
}
