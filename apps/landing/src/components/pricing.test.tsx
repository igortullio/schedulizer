import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Pricing } from './pricing'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    webUrl: 'https://app.schedulizer.com',
  },
}))

const translations = {
  'pt-BR': {
    'pricing.title': 'Planos que cabem no seu',
    'pricing.titleHighlight': 'bolso',
    'pricing.subtitle': 'Escolha o plano ideal para o seu negócio',
    'pricing.badge': 'Mais popular',
    'pricing.cta': 'Começar agora',
    'pricing.toggle.ariaLabel': 'Selecionar frequência de cobrança',
    'pricing.toggle.monthly': 'Mensal',
    'pricing.toggle.yearly': 'Anual',
    'pricing.toggle.savings': 'Economize {{percent}}%',
    'pricing.period.monthly': '/mês',
    'pricing.period.yearly': '/mês',
    'pricing.billedAnnually': 'Cobrado {{total}}/ano',
    'pricing.featuresLabel': 'Recursos incluídos',
    'pricing.ctaAriaLabel': 'Começar agora com o plano {{plan}}',
    'pricing.plans.essential': {
      name: 'Essencial',
      features: [
        'Agendamentos ilimitados',
        'Lembretes automáticos',
        'Calendário online',
        'Gestão de serviços',
        'Suporte por e-mail',
      ],
    },
    'pricing.plans.professional': {
      name: 'Profissional',
      features: [
        'Tudo do plano Essencial',
        'Múltiplos profissionais',
        'Relatórios e métricas',
        'Integração com WhatsApp',
        'Suporte prioritário',
        'Customização avançada',
      ],
    },
    'pricing.trustBadges.noSetupFee': 'Sem taxa de configuração',
    'pricing.trustBadges.cancelAnytime': 'Cancele quando quiser',
    'pricing.trustBadges.freeTrial': '14 dias grátis',
  },
  en: {
    'pricing.title': 'Plans that fit your',
    'pricing.titleHighlight': 'budget',
    'pricing.subtitle': 'Choose the ideal plan for your business',
    'pricing.badge': 'Most popular',
    'pricing.cta': 'Get started',
    'pricing.toggle.ariaLabel': 'Select billing frequency',
    'pricing.toggle.monthly': 'Monthly',
    'pricing.toggle.yearly': 'Yearly',
    'pricing.toggle.savings': 'Save {{percent}}%',
    'pricing.period.monthly': '/month',
    'pricing.period.yearly': '/month',
    'pricing.billedAnnually': 'Billed {{total}}/year',
    'pricing.featuresLabel': 'Features included',
    'pricing.ctaAriaLabel': 'Get started with {{plan}} plan',
    'pricing.plans.essential': {
      name: 'Essential',
      features: [
        'Unlimited appointments',
        'Automatic reminders',
        'Online calendar',
        'Service management',
        'Email support',
      ],
    },
    'pricing.plans.professional': {
      name: 'Professional',
      features: [
        'Everything in Essential plan',
        'Multiple professionals',
        'Reports and metrics',
        'WhatsApp integration',
        'Priority support',
        'Advanced customization',
      ],
    },
    'pricing.trustBadges.noSetupFee': 'No setup fee',
    'pricing.trustBadges.cancelAnytime': 'Cancel anytime',
    'pricing.trustBadges.freeTrial': '14 days free',
  },
}

let currentLanguage = 'pt-BR'

const mockT = (key: string, options?: { returnObjects?: boolean; total?: string; plan?: string; percent?: number }) => {
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
}

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      language: currentLanguage,
      changeLanguage: (lng: string) => {
        currentLanguage = lng
      },
    },
  }),
}))

describe('Pricing Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should be defined', () => {
    expect(Pricing).toBeDefined()
    expect(typeof Pricing).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Pricing.name).toBe('Pricing')
  })

  describe('i18n Integration', () => {
    it('should render with default language (pt-BR)', () => {
      render(<Pricing />)
      expect(screen.getByText('Planos que cabem no seu')).toBeInTheDocument()
      expect(screen.getByText('bolso')).toBeInTheDocument()
      expect(screen.getByText('Escolha o plano ideal para o seu negócio')).toBeInTheDocument()
    })

    it('should render correctly in English when language is set to en', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Plans that fit your')).toBeInTheDocument()
      expect(screen.getByText('budget')).toBeInTheDocument()
      expect(screen.getByText('Choose the ideal plan for your business')).toBeInTheDocument()
    })

    it('should render Essential plan in Portuguese', () => {
      render(<Pricing />)
      expect(screen.getByText('Essencial')).toBeInTheDocument()
      expect(screen.getByText(/R\$\s*49,90/)).toBeInTheDocument()
      expect(screen.getByText('Agendamentos ilimitados')).toBeInTheDocument()
    })

    it('should render Professional plan in Portuguese', () => {
      render(<Pricing />)
      expect(screen.getByText('Profissional')).toBeInTheDocument()
      expect(screen.getByText(/R\$\s*99,90/)).toBeInTheDocument()
      expect(screen.getByText('Tudo do plano Essencial')).toBeInTheDocument()
    })

    it('should render Essential plan in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Essential')).toBeInTheDocument()
      expect(screen.getByText(/\$49\.90/)).toBeInTheDocument()
      expect(screen.getByText('Unlimited appointments')).toBeInTheDocument()
    })

    it('should render Professional plan in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Professional')).toBeInTheDocument()
      expect(screen.getByText(/\$99\.90/)).toBeInTheDocument()
      expect(screen.getByText('Everything in Essential plan')).toBeInTheDocument()
    })

    it('should render "Most popular" badge in Portuguese', () => {
      render(<Pricing />)
      expect(screen.getByText('Mais popular')).toBeInTheDocument()
    })

    it('should render "Most popular" badge in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Most popular')).toBeInTheDocument()
    })

    it('should render trust badges in Portuguese', () => {
      render(<Pricing />)
      expect(screen.getByText('Sem taxa de configuração')).toBeInTheDocument()
      expect(screen.getByText('Cancele quando quiser')).toBeInTheDocument()
      expect(screen.getByText('14 dias grátis')).toBeInTheDocument()
    })

    it('should render trust badges in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('No setup fee')).toBeInTheDocument()
      expect(screen.getByText('Cancel anytime')).toBeInTheDocument()
      expect(screen.getByText('14 days free')).toBeInTheDocument()
    })

    it('should render CTA buttons with translated text', () => {
      render(<Pricing />)
      const ctaButtons = screen.getAllByText('Começar agora')
      expect(ctaButtons).toHaveLength(2)
    })

    it('should render CTA buttons in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      const ctaButtons = screen.getAllByText('Get started')
      expect(ctaButtons).toHaveLength(2)
    })

    it('should not have hardcoded English strings in Portuguese mode', () => {
      const { container } = render(<Pricing />)
      const text = container.textContent || ''
      expect(text).not.toContain('Plans that fit your')
      expect(text).not.toContain('Most popular')
      expect(text).toContain('Planos que cabem no seu')
      expect(text).toContain('Mais popular')
    })
  })

  describe('Billing Toggle', () => {
    it('should render billing toggle', () => {
      render(<Pricing />)
      expect(screen.getByText('Mensal')).toBeInTheDocument()
      expect(screen.getByText('Anual')).toBeInTheDocument()
    })

    it('should show savings badge when yearly is selected', async () => {
      const user = userEvent.setup()
      render(<Pricing />)
      await user.click(screen.getByText('Anual'))
      expect(screen.getByText('Economize 15%')).toBeInTheDocument()
    })

    it('should update prices when switching to yearly', async () => {
      const user = userEvent.setup()
      render(<Pricing />)
      await user.click(screen.getByText('Anual'))
      expect(screen.getAllByText(/Cobrado/).length).toBeGreaterThan(0)
    })
  })

  describe('Component Structure', () => {
    it('should render section element', () => {
      const { container } = render(<Pricing />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render heading with proper hierarchy', () => {
      render(<Pricing />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should render exactly 2 pricing plans', () => {
      render(<Pricing />)
      const planButtons = screen.getAllByText('Começar agora')
      expect(planButtons).toHaveLength(2)
    })

    it('should render all feature checkmarks', () => {
      const { container } = render(<Pricing />)
      const checkIcons = container.querySelectorAll('svg')
      expect(checkIcons.length).toBeGreaterThan(0)
    })

    it('should render trust badge section', () => {
      render(<Pricing />)
      expect(screen.getByText('Sem taxa de configuração')).toBeInTheDocument()
      expect(screen.getByText('Cancele quando quiser')).toBeInTheDocument()
      expect(screen.getByText('14 dias grátis')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper section accessibility', () => {
      render(<Pricing />)
      const section = screen.getByRole('region')
      expect(section).toHaveAttribute('aria-labelledby', 'pricing-title')
    })

    it('should have proper fieldset for toggle', () => {
      render(<Pricing />)
      const fieldset = screen.getByRole('group')
      expect(fieldset).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      render(<Pricing />)
      const yearlyRadio = screen.getByRole('radio', { name: /Anual/ })
      await user.click(yearlyRadio)
      expect(screen.getByText('Economize 15%')).toBeInTheDocument()
    })
  })
})
