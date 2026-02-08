import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PricingCard } from './pricing-card'
import type { PlanConfig } from './pricing-data'

const translations = {
  'pt-BR': {
    'pricing.badge': 'Mais popular',
    'pricing.period.monthly': '/mês',
    'pricing.period.yearly': '/mês',
    'pricing.billedAnnually': 'Cobrado {{total}}/ano',
    'pricing.featuresLabel': 'Recursos incluídos',
    'pricing.ctaAriaLabel': 'Começar agora com o plano {{plan}}',
    'pricing.cta': 'Começar agora',
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
    'pricing.badge': 'Most popular',
    'pricing.period.monthly': '/month',
    'pricing.period.yearly': '/month',
    'pricing.billedAnnually': 'Billed {{total}}/year',
    'pricing.featuresLabel': 'Features included',
    'pricing.ctaAriaLabel': 'Get started with {{plan}} plan',
    'pricing.cta': 'Get started',
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
    t: (key: string, options?: { returnObjects?: boolean; total?: string; plan?: string }) => {
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
        return result
      }
      return value || key
    },
    i18n: {
      language: currentLanguage,
    },
  }),
}))

describe('PricingCard Component', () => {
  const essentialPlan: PlanConfig = {
    planId: 'essential',
    pricing: { monthly: 49.9, yearly: 508.98 },
  }

  const professionalPlan: PlanConfig = {
    planId: 'professional',
    pricing: { monthly: 99.9, yearly: 1018.98 },
    recommended: true,
  }

  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should render plan name', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('Essencial')).toBeInTheDocument()
  })

  it('should render monthly price for monthly frequency', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText(/R\$\s*49,90/)).toBeInTheDocument()
  })

  it('should render period text', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('/mês')).toBeInTheDocument()
  })

  it('should render features list', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('Agendamentos ilimitados')).toBeInTheDocument()
    expect(screen.getByText('Lembretes automáticos')).toBeInTheDocument()
  })

  it('should render CTA button', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByRole('button', { name: /Começar agora/i })).toBeInTheDocument()
  })

  it('should call onSelect when CTA button is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={onSelect} />)
    await user.click(screen.getByRole('button'))
    expect(onSelect).toHaveBeenCalledWith('essential')
  })

  it('should show recommended badge for recommended plans', () => {
    render(<PricingCard plan={professionalPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('Mais popular')).toBeInTheDocument()
  })

  it('should not show recommended badge for non-recommended plans', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.queryByText('Mais popular')).not.toBeInTheDocument()
  })

  it('should show yearly equivalent price for yearly frequency', () => {
    render(<PricingCard plan={essentialPlan} frequency="yearly" onSelect={() => {}} />)
    expect(screen.getByText(/R\$\s*42,4/)).toBeInTheDocument()
  })

  it('should show billed annually text for yearly frequency', () => {
    render(<PricingCard plan={essentialPlan} frequency="yearly" onSelect={() => {}} />)
    expect(screen.getByText(/Cobrado/)).toBeInTheDocument()
    expect(screen.getByText(/ano/)).toBeInTheDocument()
  })

  it('should not show billed annually text for monthly frequency', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.queryByText(/Cobrado/)).not.toBeInTheDocument()
  })

  it('should render in English when language is en', () => {
    currentLanguage = 'en'
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('Essential')).toBeInTheDocument()
    expect(screen.getByText('Unlimited appointments')).toBeInTheDocument()
    expect(screen.getByText('Get started')).toBeInTheDocument()
  })

  it('should have proper accessibility attributes', () => {
    render(<PricingCard plan={essentialPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByRole('article')).toBeInTheDocument()
    expect(screen.getByRole('list')).toHaveAttribute('aria-label', 'Recursos incluídos')
  })

  it('should render professional plan features', () => {
    render(<PricingCard plan={professionalPlan} frequency="monthly" onSelect={() => {}} />)
    expect(screen.getByText('Profissional')).toBeInTheDocument()
    expect(screen.getByText('Tudo do plano Essencial')).toBeInTheDocument()
    expect(screen.getByText('Múltiplos profissionais')).toBeInTheDocument()
  })
})
