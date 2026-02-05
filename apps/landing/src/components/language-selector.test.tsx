import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { LanguageSelector } from './language-selector'

const mockChangeLanguage = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      language: 'pt-BR',
      changeLanguage: mockChangeLanguage,
    },
  }),
}))

describe('LanguageSelector Component', () => {
  beforeEach(() => {
    mockChangeLanguage.mockClear()
  })

  it('should be defined', () => {
    expect(LanguageSelector).toBeDefined()
    expect(typeof LanguageSelector).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(LanguageSelector.name).toBe('LanguageSelector')
  })

  it('should render language selector with select element', () => {
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox', { name: /languageSelector.label/i })
    expect(select).toBeInTheDocument()
  })

  it('should display all supported language options', () => {
    render(<LanguageSelector />)
    const options = screen.getAllByRole('option')
    expect(options).toHaveLength(2)
    expect(options[0]).toHaveTextContent('Português')
    expect(options[1]).toHaveTextContent('English')
  })

  it('should show current language as selected', () => {
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox') as HTMLSelectElement
    expect(select.value).toBe('pt-BR')
  })

  it('should call changeLanguage when language is selected', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox')

    await user.selectOptions(select, 'en')

    await waitFor(
      () => {
        expect(mockChangeLanguage).toHaveBeenCalledWith('en')
      },
      { timeout: 2000 },
    )
  })

  it('should have proper accessibility attributes', () => {
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox')
    expect(select).toHaveAttribute('aria-label', 'languageSelector.label')
  })

  it('should render Globe icon with proper aria-hidden', () => {
    const { container } = render(<LanguageSelector />)
    const globeIcon = container.querySelector('[aria-hidden="true"]')
    expect(globeIcon).toBeInTheDocument()
  })

  it('should have proper styling classes', () => {
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox')
    expect(select.className).toContain('cursor-pointer')
    expect(select.className).toContain('rounded-lg')
  })

  it('should allow keyboard navigation', async () => {
    const user = userEvent.setup()
    render(<LanguageSelector />)
    const select = screen.getByRole('combobox')

    await user.tab()
    expect(select).toHaveFocus()
  })
})
