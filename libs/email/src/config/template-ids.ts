import type { Locale } from '../lib/types'

export function getTemplateId(emailType: string, locale: Locale): string {
  return `${emailType}_${locale.toLowerCase()}`
}
