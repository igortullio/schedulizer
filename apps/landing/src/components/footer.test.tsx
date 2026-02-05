import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Footer } from './footer'

const translations = {
  'pt-BR': {
    'footer.brandDescription': 'Sistema completo de gestão de agendamentos para pequenos negócios que querem crescer.',
    'footer.sections.links.title': 'Links',
    'footer.sections.links.privacy': 'Política de Privacidade',
    'footer.sections.links.terms': 'Termos de Serviço',
    'footer.sections.contact.title': 'Contato',
    'footer.copyright': '© {{year}} Schedulizer. Todos os direitos reservados.',
  },
  en: {
    'footer.brandDescription': 'Complete appointment management system for small businesses that want to grow.',
    'footer.sections.links.title': 'Links',
    'footer.sections.links.privacy': 'Privacy Policy',
    'footer.sections.links.terms': 'Terms of Service',
    'footer.sections.contact.title': 'Contact',
    'footer.copyright': '© {{year}} Schedulizer. All rights reserved.',
  },
}

let currentLanguage = 'pt-BR'

const mockT = (key: string, options?: { year?: number }) => {
  const translation = translations[currentLanguage as keyof typeof translations]
  const text = translation[key as keyof typeof translation] || key

  if (options?.year && typeof text === 'string') {
    return text.replace('{{year}}', options.year.toString())
  }

  return text
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

describe('Footer Component', () => {
  beforeEach(() => {
    currentLanguage = 'pt-BR'
  })

  it('should be defined', () => {
    expect(Footer).toBeDefined()
    expect(typeof Footer).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Footer.name).toBe('Footer')
  })

  describe('i18n Integration', () => {
    it('should render with default language (pt-BR)', () => {
      render(<Footer />)
      expect(
        screen.getByText('Sistema completo de gestão de agendamentos para pequenos negócios que querem crescer.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Política de Privacidade')).toBeInTheDocument()
      expect(screen.getByText('Termos de Serviço')).toBeInTheDocument()
    })

    it('should render correctly in English when language is set to en', () => {
      currentLanguage = 'en'
      render(<Footer />)
      expect(
        screen.getByText('Complete appointment management system for small businesses that want to grow.'),
      ).toBeInTheDocument()
      expect(screen.getByText('Privacy Policy')).toBeInTheDocument()
      expect(screen.getByText('Terms of Service')).toBeInTheDocument()
    })

    it('should render brand description in Portuguese', () => {
      render(<Footer />)
      expect(
        screen.getByText('Sistema completo de gestão de agendamentos para pequenos negócios que querem crescer.'),
      ).toBeInTheDocument()
    })

    it('should render brand description in English', () => {
      currentLanguage = 'en'
      render(<Footer />)
      expect(
        screen.getByText('Complete appointment management system for small businesses that want to grow.'),
      ).toBeInTheDocument()
    })

    it('should render links section title in Portuguese', () => {
      render(<Footer />)
      expect(screen.getByText('Links')).toBeInTheDocument()
    })

    it('should render links section title in English', () => {
      currentLanguage = 'en'
      render(<Footer />)
      expect(screen.getByText('Links')).toBeInTheDocument()
    })

    it('should render contact section title in Portuguese', () => {
      render(<Footer />)
      expect(screen.getByText('Contato')).toBeInTheDocument()
    })

    it('should render contact section title in English', () => {
      currentLanguage = 'en'
      render(<Footer />)
      expect(screen.getByText('Contact')).toBeInTheDocument()
    })

    it('should render copyright with current year in Portuguese', () => {
      render(<Footer />)
      const currentYear = new Date().getFullYear()
      expect(screen.getByText(`© ${currentYear} Schedulizer. Todos os direitos reservados.`)).toBeInTheDocument()
    })

    it('should render copyright with current year in English', () => {
      currentLanguage = 'en'
      render(<Footer />)
      const currentYear = new Date().getFullYear()
      expect(screen.getByText(`© ${currentYear} Schedulizer. All rights reserved.`)).toBeInTheDocument()
    })

    it('should not have hardcoded English strings in Portuguese mode', () => {
      const { container } = render(<Footer />)
      const text = container.textContent || ''

      expect(text).not.toContain('Complete appointment management system for small businesses')
      expect(text).not.toContain('Privacy Policy')
      expect(text).toContain('Sistema completo de gestão')
      expect(text).toContain('Política de Privacidade')
    })
  })

  describe('Component Structure', () => {
    it('should render footer element', () => {
      const { container } = render(<Footer />)
      const footer = container.querySelector('footer')
      expect(footer).toBeInTheDocument()
    })

    it('should render brand section with logo and description', () => {
      render(<Footer />)
      expect(screen.getByText('Schedulizer')).toBeInTheDocument()
      expect(screen.getByText(/Sistema completo de gestão de agendamentos/)).toBeInTheDocument()
    })

    it('should render links with correct href attributes', () => {
      render(<Footer />)
      const privacyLink = screen.getByText('Política de Privacidade').closest('a')
      const termsLink = screen.getByText('Termos de Serviço').closest('a')

      expect(privacyLink).toHaveAttribute('href', '/privacy')
      expect(termsLink).toHaveAttribute('href', '/terms')
    })

    it('should render contact information', () => {
      render(<Footer />)
      expect(screen.getByText('contato@schedulizer.com')).toBeInTheDocument()
      expect(screen.getByText('+1 (555) 123-4567')).toBeInTheDocument()
    })

    it('should render contact icons', () => {
      const { container } = render(<Footer />)
      const icons = container.querySelectorAll('svg')
      expect(icons.length).toBeGreaterThan(0)
    })

    it('should render brand logo icon', () => {
      const { container } = render(<Footer />)
      const calendarIcons = container.querySelectorAll('svg')
      expect(calendarIcons.length).toBeGreaterThan(0)
    })
  })
})
