import { Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@igortullio-ui/react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Country {
  code: string
  dialCode: string
  flag: string
  maxDigits: number
  labelKey: 'phone.br' | 'phone.us'
}

const COUNTRIES: Country[] = [
  { code: 'BR', dialCode: '+55', flag: '\u{1F1E7}\u{1F1F7}', maxDigits: 11, labelKey: 'phone.br' as const },
  { code: 'US', dialCode: '+1', flag: '\u{1F1FA}\u{1F1F8}', maxDigits: 10, labelKey: 'phone.us' as const },
]

const DEFAULT_COUNTRY_CODE = 'BR'

interface PhoneInputProps {
  value: string
  onChange: (fullNumber: string) => void
  id?: string
  error?: boolean
  disabled?: boolean
  'data-testid'?: string
}

export function PhoneInput({ value, onChange, id, error, disabled, ...props }: PhoneInputProps) {
  const { t } = useTranslation('common')
  const [countryCode, setCountryCode] = useState(() => {
    for (const country of COUNTRIES) {
      if (value.startsWith(country.dialCode)) return country.code
    }
    return DEFAULT_COUNTRY_CODE
  })
  const country = COUNTRIES.find(c => c.code === countryCode) ?? COUNTRIES[0]
  const localNumber = value.startsWith(country.dialCode)
    ? value.slice(country.dialCode.length)
    : value.replace(/^\+\d+/, '')
  function handleCountryChange(code: string) {
    setCountryCode(code)
    const newCountry = COUNTRIES.find(c => c.code === code) ?? COUNTRIES[0]
    const digits = localNumber.replace(/\D/g, '')
    onChange(digits ? `${newCountry.dialCode}${digits}` : '')
  }
  function handleNumberChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, country.maxDigits)
    onChange(digits ? `${country.dialCode}${digits}` : '')
  }
  return (
    <div className="flex gap-2">
      <Select value={countryCode} onValueChange={handleCountryChange}>
        <SelectTrigger className="w-[100px] shrink-0" aria-label={t('phone.selectCountry')}>
          <SelectValue>
            {country.flag} {country.dialCode}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {COUNTRIES.map(c => (
            <SelectItem key={c.code} value={c.code}>
              {c.flag} {c.dialCode} {t(c.labelKey)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        id={id}
        type="tel"
        inputMode="numeric"
        value={localNumber}
        onChange={handleNumberChange}
        placeholder={countryCode === 'BR' ? '11999999999' : '2025551234'}
        aria-invalid={error}
        disabled={disabled}
        data-testid={props['data-testid']}
      />
    </div>
  )
}
