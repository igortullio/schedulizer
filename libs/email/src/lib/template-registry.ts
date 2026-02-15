import { getTemplateId } from '../config/template-ids'
import type { EmailType, Locale } from './types'

export class TemplateRegistry {
  getTemplateId(emailType: EmailType, locale: Locale): string {
    return getTemplateId(emailType, locale)
  }
}
