import { loadTemplateIds } from '../config/template-ids'
import type { EmailType, Locale } from './types'

export class TemplateRegistry {
  private readonly templateIds: Record<EmailType, Record<Locale, string>>

  constructor() {
    this.templateIds = loadTemplateIds()
  }

  getTemplateId(emailType: EmailType, locale: Locale): string {
    const templateId = this.templateIds[emailType]?.[locale]
    if (!templateId) {
      throw new Error(`Template ID not configured for ${emailType} (${locale})`)
    }
    return templateId
  }

  validateAllTemplateIds(): string[] {
    const missingIds: string[] = []
    for (const [emailType, locales] of Object.entries(this.templateIds)) {
      for (const [locale, templateId] of Object.entries(locales)) {
        if (!templateId) {
          missingIds.push(`${emailType} (${locale})`)
        }
      }
    }
    return missingIds
  }
}
