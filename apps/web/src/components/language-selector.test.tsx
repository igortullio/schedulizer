import { TooltipProvider } from '@igortullio-ui/react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSelector } from './language-selector'

const mockChangeLanguage = vi.fn(() => Promise.resolve())

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: {
      changeLanguage: mockChangeLanguage,
      language: 'pt-BR',
    },
  }),
}))

function renderWithTooltip(ui: React.ReactElement) {
  return render(<TooltipProvider>{ui}</TooltipProvider>)
}

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders language selector button', () => {
      renderWithTooltip(<LanguageSelector />)
      const selector = screen.getByTestId('language-selector')
      expect(selector).toBeInTheDocument()
    })

    it('displays current language label', () => {
      renderWithTooltip(<LanguageSelector />)
      const label = screen.getByTestId('language-label')
      expect(label).toHaveTextContent('Português (BR)')
    })

    it('hides label when collapsed', () => {
      renderWithTooltip(<LanguageSelector isCollapsed />)
      expect(screen.queryByTestId('language-label')).not.toBeInTheDocument()
    })

    it('renders tooltip wrapper when collapsed', () => {
      renderWithTooltip(<LanguageSelector isCollapsed />)
      const button = screen.getByTestId('language-selector')
      expect(button).toBeInTheDocument()
    })
  })

  describe('language switching', () => {
    it('cycles to next language on click', async () => {
      const user = userEvent.setup()
      renderWithTooltip(<LanguageSelector />)
      await user.click(screen.getByTestId('language-selector'))
      expect(mockChangeLanguage).toHaveBeenCalledWith('en')
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1)
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label', () => {
      renderWithTooltip(<LanguageSelector />)
      const button = screen.getByTestId('language-selector')
      expect(button).toHaveAccessibleName('Select language')
    })

    it('renders globe icon with aria-hidden', () => {
      renderWithTooltip(<LanguageSelector />)
      const selector = screen.getByTestId('language-selector')
      const icon = selector.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
