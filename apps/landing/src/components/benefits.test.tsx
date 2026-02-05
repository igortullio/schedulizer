import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Benefits } from './benefits'

const translations = {
  'pt-BR': {
    'benefits.title': 'Por que escolher',
    'benefits.titleHighlight': 'Schedulizer',
    'benefits.subtitle': 'Tudo que você precisa para gerenciar seu negócio com eficiência',
    'benefits.items': [
      {
        title: 'Agendamento online 24/7',
        description: 'Seus clientes podem agendar a qualquer hora, de qualquer lugar. Nunca perca uma oportunidade.',
      },
      {
        title: 'Lembretes automáticos',
        description: 'Reduza faltas com notificações automáticas por WhatsApp e e-mail.',
      },
      {
        title: 'Organização da agenda',
        description: 'Visualize e gerencie todos os seus compromissos em um só lugar.',
      },
      {
        title: 'Gestão multiprofissional',
        description: 'Controle a agenda de toda a sua equipe de forma centralizada.',
      },
    ],
  },
  en: {
    'benefits.title': 'Why choose',
    'benefits.titleHighlight': 'Schedulizer',
    'benefits.subtitle': 'Everything you need to efficiently manage your business',
    'benefits.items': [
      {
        title: 'Online scheduling 24/7',
        description: 'Your customers can book anytime, from anywhere. Never miss an opportunity.',
      },
      {
        title: 'Automatic reminders',
        description: 'Reduce no-shows with automatic WhatsApp and email notifications.',
      },
      {
        title: 'Schedule organization',
        description: 'View and manage all your appointments in one place.',
      },
      {
        title: 'Multi-professional management',
        description: "Control your entire team's schedule centrally.",
      },
    ],
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

describe('Benefits Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should be defined', () => {
    expect(Benefits).toBeDefined()
    expect(typeof Benefits).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Benefits.name).toBe('Benefits')
  })

  describe('i18n Integration', () => {
    it('should render with default language (pt-BR)', () => {
      render(<Benefits />)
      expect(screen.getByText(/Por que escolher/)).toBeInTheDocument()
      expect(screen.getByText('Schedulizer')).toBeInTheDocument()
      expect(screen.getByText('Tudo que você precisa para gerenciar seu negócio com eficiência')).toBeInTheDocument()
    })

    it('should render correctly in English when language is set to en', () => {
      currentLanguage = 'en'
      render(<Benefits />)
      expect(screen.getByText(/Why choose/)).toBeInTheDocument()
      expect(screen.getByText('Schedulizer')).toBeInTheDocument()
      expect(screen.getByText('Everything you need to efficiently manage your business')).toBeInTheDocument()
    })

    it('should render all benefit items in Portuguese', () => {
      render(<Benefits />)
      expect(screen.getByText('Agendamento online 24/7')).toBeInTheDocument()
      expect(screen.getByText('Lembretes automáticos')).toBeInTheDocument()
      expect(screen.getByText('Organização da agenda')).toBeInTheDocument()
      expect(screen.getByText('Gestão multiprofissional')).toBeInTheDocument()
    })

    it('should render all benefit descriptions in Portuguese', () => {
      render(<Benefits />)
      expect(screen.getByText(/Seus clientes podem agendar a qualquer hora, de qualquer lugar/)).toBeInTheDocument()
      expect(screen.getByText(/Reduza faltas com notificações automáticas/)).toBeInTheDocument()
      expect(screen.getByText(/Visualize e gerencie todos os seus compromissos/)).toBeInTheDocument()
      expect(screen.getByText(/Controle a agenda de toda a sua equipe/)).toBeInTheDocument()
    })

    it('should render all benefit items in English', () => {
      currentLanguage = 'en'
      render(<Benefits />)
      expect(screen.getByText('Online scheduling 24/7')).toBeInTheDocument()
      expect(screen.getByText('Automatic reminders')).toBeInTheDocument()
      expect(screen.getByText('Schedule organization')).toBeInTheDocument()
      expect(screen.getByText('Multi-professional management')).toBeInTheDocument()
    })

    it('should render exactly 4 benefit items', () => {
      render(<Benefits />)
      const benefitTitles = [
        'Agendamento online 24/7',
        'Lembretes automáticos',
        'Organização da agenda',
        'Gestão multiprofissional',
      ]

      benefitTitles.forEach(title => {
        expect(screen.getByText(title)).toBeInTheDocument()
      })
    })

    it('should not have hardcoded English strings in Portuguese mode', () => {
      const { container } = render(<Benefits />)
      const text = container.textContent || ''

      expect(text).not.toContain('Why choose')
      expect(text).not.toContain('Everything you need to efficiently manage')
      expect(text).toContain('Por que escolher')
      expect(text).toContain('Tudo que você precisa para gerenciar')
    })
  })

  describe('Component Structure', () => {
    it('should render section element', () => {
      const { container } = render(<Benefits />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render heading with proper hierarchy', () => {
      render(<Benefits />)
      const heading = screen.getByRole('heading', { level: 2 })
      expect(heading).toBeInTheDocument()
    })

    it('should render all benefit icons', () => {
      const { container } = render(<Benefits />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThanOrEqual(4)
    })

    it('should render benefit cards with proper structure', () => {
      const { container } = render(<Benefits />)
      const benefitCards = container.querySelectorAll('.glass')
      expect(benefitCards.length).toBe(4)
    })
  })
})
