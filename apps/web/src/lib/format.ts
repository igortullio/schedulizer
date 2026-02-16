const LOCALE_MAP: Record<string, string> = {
  'pt-BR': 'pt-BR',
  en: 'en-US',
}

const CURRENCY_MAP: Record<string, string> = {
  'pt-BR': 'BRL',
  en: 'USD',
}

export function getLocale(language: string): string {
  return LOCALE_MAP[language] ?? 'en-US'
}

export function getCurrency(language: string): string {
  return CURRENCY_MAP[language] ?? 'USD'
}

export function formatPrice(amount: number, language: string): string {
  const locale = getLocale(language)
  const currency = getCurrency(language)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function formatDate(dateString: string | null, language: string): string {
  if (!dateString) return 'N/A'
  const locale = getLocale(language)
  return new Date(dateString).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function formatDateShort(timestamp: number, language: string): string {
  const locale = getLocale(language)
  return new Date(timestamp * 1000).toLocaleDateString(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function parseCurrencyInput(valueInCents: number): string {
  const amount = valueInCents / 100
  return amount.toFixed(2)
}

export function formatCurrency(amountInCents: number, currency: string, language: string): string {
  const locale = getLocale(language)
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amountInCents / 100)
}
