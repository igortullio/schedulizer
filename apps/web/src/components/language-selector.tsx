import { Tooltip, TooltipContent, TooltipTrigger } from '@igortullio-ui/react'
import { Globe } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const LANGUAGES = [
  { code: 'pt-BR', label: 'Português (BR)' },
  { code: 'en', label: 'English' },
] as const

interface LanguageSelectorProps {
  isCollapsed?: boolean
}

export function LanguageSelector({ isCollapsed = false }: LanguageSelectorProps) {
  const { i18n } = useTranslation()
  const currentLanguage = LANGUAGES.find(lang => lang.code === i18n.language) ?? LANGUAGES[0]
  function handleToggleLanguage() {
    const currentIndex = LANGUAGES.findIndex(lang => lang.code === i18n.language)
    const nextIndex = (currentIndex + 1) % LANGUAGES.length
    void i18n.changeLanguage(LANGUAGES[nextIndex].code)
  }
  const button = (
    <button
      type="button"
      onClick={handleToggleLanguage}
      className={`flex w-full items-center gap-3 rounded-md py-2 text-sm font-medium text-sidebar-foreground/60 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground ${isCollapsed ? 'justify-center px-0' : 'px-3'}`}
      data-testid="language-selector"
      aria-label="Select language"
    >
      <Globe className="h-5 w-5" aria-hidden="true" />
      {isCollapsed ? null : <span data-testid="language-label">{currentLanguage.label}</span>}
    </button>
  )
  if (isCollapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side="right">{currentLanguage.label}</TooltipContent>
      </Tooltip>
    )
  }
  return button
}
