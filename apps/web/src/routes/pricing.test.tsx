import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as PricingPage } from './pricing'

const mockUseSession = vi.fn()
const mockNavigate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
  authClient: {
    useActiveOrganization: () => ({ data: { id: 'org-1', name: 'Test Org' }, isPending: false }),
  },
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

vi.mock('@/lib/format', () => ({
  formatPrice: (amount: number) => `$${amount.toFixed(2)}`,
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

global.fetch = vi.fn()

describe('PricingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      isPending: false,
    })
  })

  function renderWithRouter() {
    return render(
      <MemoryRouter initialEntries={['/pricing']}>
        <PricingPage />
      </MemoryRouter>,
    )
  }

  describe('rendering', () => {
    it('renders pricing heading', () => {
      renderWithRouter()
      expect(screen.getByRole('heading', { name: 'pricing.title' })).toBeInTheDocument()
    })

    it('renders free trial message', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.trustBadges.freeTrial')).toBeInTheDocument()
    })

    it('renders both plan cards', () => {
      renderWithRouter()
      expect(screen.getByTestId('plan-card-essential')).toBeInTheDocument()
      expect(screen.getByTestId('plan-card-professional')).toBeInTheDocument()
    })

    it('renders billing frequency toggle', () => {
      renderWithRouter()
      expect(screen.getByTestId('monthly-toggle')).toBeInTheDocument()
      expect(screen.getByTestId('yearly-toggle')).toBeInTheDocument()
    })

    it('renders back to dashboard button', () => {
      renderWithRouter()
      expect(screen.getByTestId('back-button')).toBeInTheDocument()
    })

    it('renders trust badges', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.trustBadges.noSetupFees')).toBeInTheDocument()
      expect(screen.getByText('pricing.trustBadges.cancelAnytime')).toBeInTheDocument()
    })
  })

  describe('billing frequency toggle', () => {
    it('monthly is selected by default', () => {
      renderWithRouter()
      const monthlyRadio = screen.getByRole('radio', { name: /pricing\.toggle\.monthly/i })
      expect(monthlyRadio).toBeChecked()
    })

    it('switches to yearly when clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      const yearlyRadio = screen.getByRole('radio', { name: /pricing\.toggle\.yearly/i })
      await user.click(yearlyRadio)
      expect(yearlyRadio).toBeChecked()
      expect(screen.getByRole('radio', { name: /pricing\.toggle\.monthly/i })).not.toBeChecked()
    })

    it('shows save percentage on yearly toggle', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.toggle.savings')).toBeInTheDocument()
    })
  })

  describe('plan features', () => {
    it('displays Essential plan features', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.plans.essential.features.teamMembers')).toBeInTheDocument()
      expect(screen.getByText('pricing.plans.essential.features.basicScheduling')).toBeInTheDocument()
    })

    it('displays Professional plan features', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.plans.professional.features.unlimitedTeam')).toBeInTheDocument()
      expect(screen.getByText('pricing.plans.professional.features.advancedScheduling')).toBeInTheDocument()
    })

    it('shows recommended badge on Professional plan', () => {
      renderWithRouter()
      expect(screen.getByText('pricing.recommended')).toBeInTheDocument()
    })
  })

  describe('checkout buttons', () => {
    it('renders checkout buttons for both plans', () => {
      renderWithRouter()
      expect(screen.getByTestId('checkout-button-essential')).toBeInTheDocument()
      expect(screen.getByTestId('checkout-button-professional')).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('navigates back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      await user.click(screen.getByTestId('back-button'))
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('accessibility', () => {
    it('has radio inputs for billing frequency toggle', () => {
      renderWithRouter()
      expect(screen.getByRole('radio', { name: /pricing\.toggle\.monthly/i })).toBeInTheDocument()
      expect(screen.getByRole('radio', { name: /pricing\.toggle\.yearly/i })).toBeInTheDocument()
    })

    it('radio inputs are properly grouped', () => {
      renderWithRouter()
      const radios = screen.getAllByRole('radio')
      expect(radios).toHaveLength(2)
      expect(radios[0]).toHaveAttribute('name', 'billing-frequency')
      expect(radios[1]).toHaveAttribute('name', 'billing-frequency')
    })
  })
})
