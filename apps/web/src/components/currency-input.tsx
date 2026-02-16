import { Input } from '@igortullio-ui/react'
import { useTranslation } from 'react-i18next'
import { getCurrency, getLocale } from '@/lib/format'

interface CurrencyInputProps {
  id?: string
  value: number
  onChange: (valueInCents: number) => void
  required?: boolean
  'data-testid'?: string
}

function formatCentsToDisplay(cents: number, language: string): string {
  if (cents === 0) return ''
  const locale = getLocale(language)
  const currency = getCurrency(language)
  const amount = cents / 100
  const formatted = new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
  return formatted.replace(/[^\d.,]/g, '').trim()
}

function getPlaceholder(language: string): string {
  return language === 'pt-BR' ? '50,00' : '50.00'
}

function getDecimalSeparator(language: string): string {
  return language === 'pt-BR' ? ',' : '.'
}

export function CurrencyInput({ id, value, onChange, required, ...props }: CurrencyInputProps) {
  const { i18n } = useTranslation()
  const language = i18n.language
  const displayValue = formatCentsToDisplay(value, language)
  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    const digitsOnly = raw.replace(/\D/g, '')
    const cents = Number.parseInt(digitsOnly, 10) || 0
    onChange(cents)
  }
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    const separator = getDecimalSeparator(language)
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Home', 'End']
    if (allowedKeys.includes(e.key)) return
    if (e.key === separator || /\d/.test(e.key)) return
    e.preventDefault()
  }
  return (
    <Input
      id={id}
      inputMode="decimal"
      value={displayValue}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      placeholder={getPlaceholder(language)}
      required={required}
      data-testid={props['data-testid']}
    />
  )
}
