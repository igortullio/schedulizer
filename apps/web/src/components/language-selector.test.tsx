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

describe('LanguageSelector', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders language selector with dropdown', () => {
      render(<LanguageSelector />)
      const selector = screen.getByTestId('language-selector')
      expect(selector).toBeInTheDocument()
    })

    it('renders select element with correct aria-label', () => {
      render(<LanguageSelector />)
      const select = screen.getByTestId('language-select')
      expect(select).toHaveAttribute('aria-label', 'Select language')
    })

    it('displays available languages (pt-BR and en)', () => {
      render(<LanguageSelector />)
      const ptBrOption = screen.getByTestId('language-option-pt-BR')
      const enOption = screen.getByTestId('language-option-en')
      expect(ptBrOption).toBeInTheDocument()
      expect(enOption).toBeInTheDocument()
      expect(ptBrOption).toHaveTextContent('Português (BR)')
      expect(enOption).toHaveTextContent('English')
    })

    it('displays current selected language correctly', () => {
      render(<LanguageSelector />)
      const select = screen.getByTestId('language-select') as HTMLSelectElement
      expect(select.value).toBe('pt-BR')
    })
  })

  describe('language switching', () => {
    it('changes language when user selects different option', async () => {
      const user = userEvent.setup()
      render(<LanguageSelector />)
      const select = screen.getByTestId('language-select')
      await user.selectOptions(select, 'en')
      expect(mockChangeLanguage).toHaveBeenCalledWith('en')
      expect(mockChangeLanguage).toHaveBeenCalledTimes(1)
    })

    it('calls changeLanguage with pt-BR when pt-BR is selected', async () => {
      const user = userEvent.setup()
      render(<LanguageSelector />)
      const select = screen.getByTestId('language-select')
      await user.selectOptions(select, 'pt-BR')
      expect(mockChangeLanguage).toHaveBeenCalledWith('pt-BR')
    })
  })

  describe('accessibility', () => {
    it('has proper aria-label on select element', () => {
      render(<LanguageSelector />)
      const select = screen.getByTestId('language-select')
      expect(select).toHaveAccessibleName('Select language')
    })

    it('renders globe icon with aria-hidden', () => {
      render(<LanguageSelector />)
      const selector = screen.getByTestId('language-selector')
      const icon = selector.querySelector('svg')
      expect(icon).toHaveAttribute('aria-hidden', 'true')
    })
  })
})
