import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'en', label: 'English' },
] as const

interface LanguageSelectorProps {
  variant?: 'light' | 'dark'
}

export function LanguageSelector({ variant = 'light' }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  function handleLanguageChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const newLanguage = event.target.value
    void i18n.changeLanguage(newLanguage)
  }
  const globeClass = variant === 'dark' ? 'h-4 w-4 text-zinc-400' : 'h-4 w-4 text-muted-foreground'
  const selectClass =
    variant === 'dark'
      ? 'border-none bg-transparent text-sm text-zinc-100 focus:outline-none focus:ring-0'
      : 'border-none bg-transparent text-sm text-foreground focus:outline-none focus:ring-0'
  return (
    <div className="flex items-center gap-2" data-testid="language-selector">
      <Globe className={globeClass} aria-hidden="true" />
      <select
        value={i18n.language}
        onChange={handleLanguageChange}
        className={selectClass}
        data-testid="language-select"
        aria-label="Select language"
      >
        {LANGUAGES.map(lang => (
          <option key={lang.code} value={lang.code} data-testid={`language-option-${lang.code}`}>
            {lang.label}
          </option>
        ))}
      </select>
    </div>
  )
}
