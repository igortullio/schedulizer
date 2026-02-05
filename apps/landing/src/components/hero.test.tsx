import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Hero } from './hero'

const translations = {
  'pt-BR': {
    'hero.badge': 'Simplifique seus agendamentos',
    'hero.title': 'Organize seus compromissos',
    'hero.titleHighlight': 'profissionalmente',
    'hero.subtitle':
      'Sistema completo para salões, barbearias e estúdios. Agendamento online 24/7, lembretes automáticos e gestão simplificada.',
    'hero.cta.primary': 'Começar gratuitamente',
    'hero.cta.secondary': 'Assistir demonstração',
    'hero.features.scheduling': 'Agendamento 24/7',
    'hero.features.setup': 'Configure em 5 minutos',
    'hero.features.trial': '14 dias grátis',
  },
  en: {
    'hero.badge': 'Simplify your scheduling',
    'hero.title': 'Organize your appointments',
    'hero.titleHighlight': 'professionally',
    'hero.subtitle':
      'Complete system for salons, barbershops and studios. Online scheduling 24/7, automatic reminders and simplified management.',
    'hero.cta.primary': 'Start for free',
    'hero.cta.secondary': 'Watch demo',
    'hero.features.scheduling': '24/7 Scheduling',
    'hero.features.setup': 'Setup in 5 minutes',
    'hero.features.trial': '14-day free trial',
  },
}

let currentLanguage = 'pt-BR'

const mockT = (key: string) => {
  return translations[currentLanguage as keyof typeof translations][key as keyof (typeof translations)['pt-BR']] || key
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

describe('Hero Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should be defined', () => {
    expect(Hero).toBeDefined()
    expect(typeof Hero).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Hero.name).toBe('Hero')
  })

  describe('i18n Integration', () => {
    it('should render with default language (pt-BR)', () => {
      render(<Hero />)
      expect(screen.getByText('Simplifique seus agendamentos')).toBeInTheDocument()
      expect(screen.getByText('Organize seus compromissos')).toBeInTheDocument()
      expect(screen.getByText('profissionalmente')).toBeInTheDocument()
      expect(screen.getByText(/Sistema completo para salões/)).toBeInTheDocument()
    })

    it('should render correctly in English when language is set to en', () => {
      currentLanguage = 'en'
      render(<Hero />)
      expect(screen.getByText('Simplify your scheduling')).toBeInTheDocument()
      expect(screen.getByText('Organize your appointments')).toBeInTheDocument()
      expect(screen.getByText('professionally')).toBeInTheDocument()
      expect(screen.getByText(/Complete system for salons/)).toBeInTheDocument()
    })

    it('should render CTA buttons with translated text', () => {
      render(<Hero />)
      expect(screen.getByText('Começar gratuitamente')).toBeInTheDocument()
      expect(screen.getByText('Assistir demonstração')).toBeInTheDocument()
    })

    it('should render feature highlights with translated text', () => {
      render(<Hero />)
      expect(screen.getByText('Agendamento 24/7')).toBeInTheDocument()
      expect(screen.getByText('Configure em 5 minutos')).toBeInTheDocument()
      expect(screen.getByText('14 dias grátis')).toBeInTheDocument()
    })

    it('should render feature highlights in English', () => {
      currentLanguage = 'en'
      render(<Hero />)
      expect(screen.getByText('24/7 Scheduling')).toBeInTheDocument()
      expect(screen.getByText('Setup in 5 minutes')).toBeInTheDocument()
      expect(screen.getByText('14-day free trial')).toBeInTheDocument()
    })

    it('should call onCtaClick when primary CTA is clicked', async () => {
      const user = userEvent.setup()
      const onCtaClick = vi.fn()
      render(<Hero onCtaClick={onCtaClick} />)

      const primaryButton = screen.getByText('Começar gratuitamente')
      await user.click(primaryButton)

      expect(onCtaClick).toHaveBeenCalledTimes(1)
    })

    it('should not have hardcoded strings', () => {
      const { container } = render(<Hero />)
      const text = container.textContent || ''

      expect(text).not.toContain('Simplify your scheduling')
      expect(text).not.toContain('Organize your appointments')
      expect(text).toContain('Simplifique seus agendamentos')
      expect(text).toContain('Organize seus compromissos')
    })
  })

  describe('Component Structure', () => {
    it('should render section element', () => {
      const { container } = render(<Hero />)
      const section = container.querySelector('section')
      expect(section).toBeInTheDocument()
    })

    it('should render heading with proper hierarchy', () => {
      render(<Hero />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('should render both CTA buttons', () => {
      render(<Hero />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(2)
    })

    it('should render feature icons', () => {
      const { container } = render(<Hero />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })
  })
})
