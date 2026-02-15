import { DEFAULT_LOCALE, type Locale } from './types'

export function extractLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return DEFAULT_LOCALE
  const normalized = acceptLanguage.trim().toLowerCase()
  if (normalized.startsWith('en')) return 'en'
  return DEFAULT_LOCALE
}
