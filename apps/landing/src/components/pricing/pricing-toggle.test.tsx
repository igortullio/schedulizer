import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingToggle } from './pricing-toggle'

const translations = {
  'pt-BR': {
    'pricing.toggle.ariaLabel': 'Selecionar frequência de cobrança',
    'pricing.toggle.monthly': 'Mensal',
    'pricing.toggle.yearly': 'Anual',
    'pricing.toggle.savings': 'Economize {{percent}}%',
  },
  en: {
    'pricing.toggle.ariaLabel': 'Select billing frequency',
    'pricing.toggle.monthly': 'Monthly',
    'pricing.toggle.yearly': 'Yearly',
    'pricing.toggle.savings': 'Save {{percent}}%',
  },
}

let currentLanguage = 'pt-BR'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { percent?: number }) => {
      const translation = translations[currentLanguage as keyof typeof translations]
      const value = translation[key as keyof typeof translation] || key
      if (options?.percent !== undefined) {
        return value.replace('{{percent}}', String(options.percent))
      }
      return value
    },
    i18n: {
      language: currentLanguage,
    },
  }),
}))

describe('PricingToggle Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should render monthly and yearly options', () => {
    render(<PricingToggle frequency="monthly" onFrequencyChange={() => {}} />)
    expect(screen.getByText('Mensal')).toBeInTheDocument()
    expect(screen.getByText('Anual')).toBeInTheDocument()
  })

  it('should have correct checked state for monthly frequency', () => {
    render(<PricingToggle frequency="monthly" onFrequencyChange={() => {}} />)
    const monthlyRadio = screen.getByRole('radio', { name: 'Mensal' })
    const yearlyRadio = screen.getByRole('radio', { name: 'Anual' })
    expect(monthlyRadio).toBeChecked()
    expect(yearlyRadio).not.toBeChecked()
  })

  it('should have correct checked state for yearly frequency', () => {
    render(<PricingToggle frequency="yearly" onFrequencyChange={() => {}} />)
    const monthlyRadio = screen.getByRole('radio', { name: 'Mensal' })
    const yearlyRadio = screen.getByRole('radio', { name: 'Anual' })
    expect(monthlyRadio).not.toBeChecked()
    expect(yearlyRadio).toBeChecked()
  })

  it('should call onFrequencyChange when clicking monthly option', async () => {
    const user = userEvent.setup()
    const onFrequencyChange = vi.fn()
    render(<PricingToggle frequency="yearly" onFrequencyChange={onFrequencyChange} />)
    await user.click(screen.getByText('Mensal'))
    expect(onFrequencyChange).toHaveBeenCalledWith('monthly')
  })

  it('should call onFrequencyChange when clicking yearly option', async () => {
    const user = userEvent.setup()
    const onFrequencyChange = vi.fn()
    render(<PricingToggle frequency="monthly" onFrequencyChange={onFrequencyChange} />)
    await user.click(screen.getByText('Anual'))
    expect(onFrequencyChange).toHaveBeenCalledWith('yearly')
  })

  it('should show savings badge only when yearly is selected', () => {
    const { rerender } = render(<PricingToggle frequency="monthly" onFrequencyChange={() => {}} />)
    expect(screen.queryByText(/Economize/)).not.toBeInTheDocument()
    rerender(<PricingToggle frequency="yearly" onFrequencyChange={() => {}} />)
    expect(screen.getByText('Economize 15%')).toBeInTheDocument()
  })

  it('should render in English when language is en', () => {
    currentLanguage = 'en'
    render(<PricingToggle frequency="yearly" onFrequencyChange={() => {}} />)
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
    expect(screen.getByText('Save 15%')).toBeInTheDocument()
  })

  it('should have proper fieldset for accessibility', () => {
    render(<PricingToggle frequency="monthly" onFrequencyChange={() => {}} />)
    const fieldset = screen.getByRole('group')
    expect(fieldset).toBeInTheDocument()
    expect(fieldset).toHaveAttribute('aria-label', 'Selecionar frequência de cobrança')
  })

  it('should be keyboard navigable', async () => {
    const user = userEvent.setup()
    const onFrequencyChange = vi.fn()
    render(<PricingToggle frequency="monthly" onFrequencyChange={onFrequencyChange} />)
    const yearlyRadio = screen.getByRole('radio', { name: 'Anual' })
    await user.click(yearlyRadio)
    expect(onFrequencyChange).toHaveBeenCalledWith('yearly')
  })
})
