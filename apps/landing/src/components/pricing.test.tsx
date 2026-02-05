import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Pricing } from './pricing'

const translations = {
  'pt-BR': {
    'pricing.title': 'Planos que cabem no seu',
    'pricing.titleHighlight': 'bolso',
    'pricing.subtitle': 'Escolha o plano ideal para o seu negócio',
    'pricing.badge': 'Mais popular',
    'pricing.cta': 'Começar agora',
    'pricing.plans.essential': {
      name: 'Essencial',
      price: 'R$ 49,90',
      period: '/mês',
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
      price: 'R$ 99,90',
      period: '/mês',
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
    'pricing.plans.essential': {
      name: 'Essential',
      price: '$49.90',
      period: '/month',
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
      price: '$99.90',
      period: '/month',
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

const mockT = (key: string, options?: { returnObjects?: boolean }) => {
  const translation = translations[currentLanguage as keyof typeof translations]
  if (options?.returnObjects) {
    return translation[key as keyof typeof translation]
  }
  return translation[key as keyof typeof translation] || key
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
      expect(screen.getByText('R$ 49,90')).toBeInTheDocument()
      expect(screen.getByText('Agendamentos ilimitados')).toBeInTheDocument()
    })

    it('should render Professional plan in Portuguese', () => {
      render(<Pricing />)
      expect(screen.getByText('Profissional')).toBeInTheDocument()
      expect(screen.getByText('R$ 99,90')).toBeInTheDocument()
      expect(screen.getByText('Tudo do plano Essencial')).toBeInTheDocument()
    })

    it('should render Essential plan in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Essential')).toBeInTheDocument()
      expect(screen.getByText('$49.90')).toBeInTheDocument()
      expect(screen.getByText('Unlimited appointments')).toBeInTheDocument()
    })

    it('should render Professional plan in English', () => {
      currentLanguage = 'en'
      render(<Pricing />)
      expect(screen.getByText('Professional')).toBeInTheDocument()
      expect(screen.getByText('$99.90')).toBeInTheDocument()
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

  describe('Plan Selection', () => {
    it('should call onPlanSelect with essential when Essential plan CTA is clicked', async () => {
      const user = userEvent.setup()
      const onPlanSelect = vi.fn()
      render(<Pricing onPlanSelect={onPlanSelect} />)

      const essentialButton = screen.getAllByText('Começar agora')[0]
      await user.click(essentialButton)

      expect(onPlanSelect).toHaveBeenCalledWith('essential')
    })

    it('should call onPlanSelect with professional when Professional plan CTA is clicked', async () => {
      const user = userEvent.setup()
      const onPlanSelect = vi.fn()
      render(<Pricing onPlanSelect={onPlanSelect} />)

      const professionalButton = screen.getAllByText('Começar agora')[1]
      await user.click(professionalButton)

      expect(onPlanSelect).toHaveBeenCalledWith('professional')
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
})
