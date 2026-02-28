import type { TemplateComponent } from '../types'

export const LOGIN_VERIFICATION_TEMPLATE_NAME = 'magic_link'

export function buildLoginVerificationComponents(urlSuffix: string): TemplateComponent[] {
  return [
    {
      type: 'button',
      sub_type: 'url',
      index: 0,
      parameters: [{ type: 'text', text: urlSuffix }],
    },
  ]
}
