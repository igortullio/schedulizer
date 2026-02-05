import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português' },
  { code: 'en', label: 'English' },
] as const

type LanguageCode = (typeof SUPPORTED_LANGUAGES)[number]['code']

export function LanguageSelector() {
  const { i18n, t } = useTranslation()

  const handleLanguageChange = (languageCode: LanguageCode) => {
    i18n.changeLanguage(languageCode)
  }

  return (
    <div className="relative inline-block">
      <select
        value={i18n.language}
        onChange={e => handleLanguageChange(e.target.value as LanguageCode)}
        aria-label={t('languageSelector.label')}
        className="appearance-none cursor-pointer rounded-lg border border-border bg-background/50 py-2 pl-9 pr-8 text-sm font-medium text-foreground backdrop-blur-sm transition-all duration-200 hover:border-primary focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
      >
        {SUPPORTED_LANGUAGES.map(language => (
          <option key={language.code} value={language.code}>
            {language.label}
          </option>
        ))}
      </select>
      <Globe
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      <svg
        className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
      </svg>
    </div>
  )
}
