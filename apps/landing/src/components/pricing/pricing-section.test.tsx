import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingSection } from './pricing-section'

const translations = {
  'pt-BR': {
    'pricing.title': 'Planos que cabem no seu',
    'pricing.titleHighlight': 'bolso',
    'pricing.subtitle': 'Escolha o plano ideal para o seu negócio',
    'pricing.badge': 'Mais popular',
    'pricing.toggle.ariaLabel': 'Selecionar frequência de cobrança',
    'pricing.toggle.monthly': 'Mensal',
    'pricing.toggle.yearly': 'Anual',
    'pricing.toggle.savings': 'Economize {{percent}}%',
    'pricing.period.monthly': '/mês',
    'pricing.period.yearly': '/mês',
    'pricing.billedAnnually': 'Cobrado {{total}}/ano',
    'pricing.featuresLabel': 'Recursos incluídos',
    'pricing.ctaAriaLabel': 'Começar agora com o plano {{plan}}',
    'pricing.cta': 'Começar agora',
    'pricing.trustBadges.noSetupFee': 'Sem taxa de configuração',
    'pricing.trustBadges.cancelAnytime': 'Cancele quando quiser',
    'pricing.trustBadges.freeTrial': '14 dias grátis',
    'pricing.plans.essential': {
      name: 'Essencial',
      features: ['Agendamentos ilimitados', 'Lembretes automáticos'],
    },
    'pricing.plans.professional': {
      name: 'Profissional',
      features: ['Tudo do plano Essencial', 'Múltiplos profissionais'],
    },
  },
  en: {
    'pricing.title': 'Plans that fit your',
    'pricing.titleHighlight': 'budget',
    'pricing.subtitle': 'Choose the ideal plan for your business',
    'pricing.badge': 'Most popular',
    'pricing.toggle.ariaLabel': 'Select billing frequency',
    'pricing.toggle.monthly': 'Monthly',
    'pricing.toggle.yearly': 'Yearly',
    'pricing.toggle.savings': 'Save {{percent}}%',
    'pricing.period.monthly': '/month',
    'pricing.period.yearly': '/month',
    'pricing.billedAnnually': 'Billed {{total}}/year',
    'pricing.featuresLabel': 'Features included',
    'pricing.ctaAriaLabel': 'Get started with {{plan}} plan',
    'pricing.cta': 'Get started',
    'pricing.trustBadges.noSetupFee': 'No setup fee',
    'pricing.trustBadges.cancelAnytime': 'Cancel anytime',
    'pricing.trustBadges.freeTrial': '14 days free',
    'pricing.plans.essential': {
      name: 'Essential',
      features: ['Unlimited appointments', 'Automatic reminders'],
    },
    'pricing.plans.professional': {
      name: 'Professional',
      features: ['Everything in Essential plan', 'Multiple professionals'],
    },
  },
}

let currentLanguage = 'pt-BR'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: { returnObjects?: boolean; total?: string; plan?: string; percent?: number }) => {
      const translation = translations[currentLanguage as keyof typeof translations]
      const value = translation[key as keyof typeof translation]
      if (options?.returnObjects) {
        return value
      }
      if (typeof value === 'string') {
        let result = value
        if (options?.total) {
          result = result.replace('{{total}}', options.total)
        }
        if (options?.plan) {
          result = result.replace('{{plan}}', options.plan)
        }
        if (options?.percent !== undefined) {
          result = result.replace('{{percent}}', String(options.percent))
        }
        return result
      }
      return value || key
    },
    i18n: {
      language: currentLanguage,
    },
  }),
}))

describe('PricingSection Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should render section title', () => {
    render(<PricingSection />)
    expect(screen.getByText('Planos que cabem no seu')).toBeInTheDocument()
    expect(screen.getByText('bolso')).toBeInTheDocument()
  })

  it('should render subtitle', () => {
    render(<PricingSection />)
    expect(screen.getByText('Escolha o plano ideal para o seu negócio')).toBeInTheDocument()
  })

  it('should render billing toggle', () => {
    render(<PricingSection />)
    expect(screen.getByText('Mensal')).toBeInTheDocument()
    expect(screen.getByText('Anual')).toBeInTheDocument()
  })

  it('should render two pricing cards', () => {
    render(<PricingSection />)
    expect(screen.getByText('Essencial')).toBeInTheDocument()
    expect(screen.getByText('Profissional')).toBeInTheDocument()
  })

  it('should render trust badges', () => {
    render(<PricingSection />)
    expect(screen.getByText('Sem taxa de configuração')).toBeInTheDocument()
    expect(screen.getByText('Cancele quando quiser')).toBeInTheDocument()
    expect(screen.getByText('14 dias grátis')).toBeInTheDocument()
  })

  it('should switch to yearly pricing when toggle is clicked', async () => {
    const user = userEvent.setup()
    render(<PricingSection />)
    await user.click(screen.getByText('Anual'))
    expect(screen.getByText('Economize 15%')).toBeInTheDocument()
    expect(screen.getAllByText(/Cobrado/).length).toBeGreaterThan(0)
  })

  it('should call onPlanSelect with plan and frequency when CTA is clicked', async () => {
    const user = userEvent.setup()
    const onPlanSelect = vi.fn()
    render(<PricingSection onPlanSelect={onPlanSelect} />)
    const ctaButtons = screen.getAllByText('Começar agora')
    await user.click(ctaButtons[0])
    expect(onPlanSelect).toHaveBeenCalledWith('essential', 'monthly')
  })

  it('should call onPlanSelect with yearly frequency when toggle is yearly', async () => {
    const user = userEvent.setup()
    const onPlanSelect = vi.fn()
    render(<PricingSection onPlanSelect={onPlanSelect} />)
    await user.click(screen.getByText('Anual'))
    const ctaButtons = screen.getAllByText('Começar agora')
    await user.click(ctaButtons[1])
    expect(onPlanSelect).toHaveBeenCalledWith('professional', 'yearly')
  })

  it('should render in English when language is en', () => {
    currentLanguage = 'en'
    render(<PricingSection />)
    expect(screen.getByText('Plans that fit your')).toBeInTheDocument()
    expect(screen.getByText('budget')).toBeInTheDocument()
    expect(screen.getByText('Monthly')).toBeInTheDocument()
    expect(screen.getByText('Yearly')).toBeInTheDocument()
  })

  it('should have proper section accessibility', () => {
    render(<PricingSection />)
    const section = screen.getByRole('region')
    expect(section).toHaveAttribute('aria-labelledby', 'pricing-title')
  })

  it('should render heading with proper level', () => {
    render(<PricingSection />)
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
  })

  it('should start with monthly frequency by default', () => {
    render(<PricingSection />)
    const monthlyRadio = screen.getByRole('radio', { name: 'Mensal' })
    expect(monthlyRadio).toBeChecked()
  })

  it('should show savings badge after switching to yearly', async () => {
    const user = userEvent.setup()
    render(<PricingSection />)
    expect(screen.queryByText(/Economize/)).not.toBeInTheDocument()
    await user.click(screen.getByText('Anual'))
    expect(screen.getByText('Economize 15%')).toBeInTheDocument()
  })
})
