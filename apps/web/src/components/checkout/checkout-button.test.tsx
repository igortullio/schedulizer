import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CheckoutButton } from './checkout-button'

const mockUseSession = vi.fn()
const mockUseActiveOrganization = vi.fn()
const mockNavigate = vi.fn()
const mockLocation = { pathname: '/pricing', search: '' }

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
    useActiveOrganization: () => mockUseActiveOrganization(),
  },
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useLocation: () => mockLocation,
  }
})

const mockFetch = vi.fn()
global.fetch = mockFetch
const mockLocationHref = vi.fn()

describe('CheckoutButton', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    global.fetch = mockFetch
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      isPending: false,
    })
    mockUseActiveOrganization.mockReturnValue({
      data: { id: 'org-1', name: 'Test Org' },
      isPending: false,
    })
    Object.defineProperty(window, 'location', {
      value: {
        origin: 'http://localhost:5173',
        get href() {
          return ''
        },
        set href(url: string) {
          mockLocationHref(url)
        },
      },
      writable: true,
      configurable: true,
    })
  })

  describe('rendering', () => {
    it('renders button with children', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toHaveTextContent('Get Started')
    })

    it('renders button with correct test id', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Subscribe
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toBeInTheDocument()
    })
  })

  describe('authentication state', () => {
    it('redirects to login when unauthenticated user clicks button', async () => {
      const user = userEvent.setup()
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      expect(mockNavigate).toHaveBeenCalledWith('/auth/login?redirect=%2Fpricing')
    })

    it('does not show auth hint when user is not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.queryByTestId('checkout-auth-hint')).not.toBeInTheDocument()
    })

    it('redirects to org-select when authenticated but no active org', async () => {
      const user = userEvent.setup()
      mockUseActiveOrganization.mockReturnValue({
        data: null,
        isPending: false,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      expect(mockNavigate).toHaveBeenCalledWith('/auth/org-select?redirect=%2Fpricing')
      expect(mockFetch).not.toHaveBeenCalled()
    })

    it('disables button while active org is loading', () => {
      mockUseActiveOrganization.mockReturnValue({
        data: null,
        isPending: true,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })

    it('disables button while session is loading', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })

    it('enables button when user is authenticated', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).not.toBeDisabled()
    })

    it('button is not disabled when user is not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).not.toBeDisabled()
    })
  })

  describe('loading state', () => {
    it('shows loading state during checkout', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ data: { url: 'https://checkout.stripe.com/session' } }),
                }),
              100,
            ),
          ),
      )
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      expect(screen.getByText('checkout.processing')).toBeInTheDocument()
    })

    it('disables button during loading', async () => {
      const user = userEvent.setup()
      mockFetch.mockImplementation(
        () =>
          new Promise(resolve =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  json: () => Promise.resolve({ data: { url: 'https://checkout.stripe.com/session' } }),
                }),
              100,
            ),
          ),
      )
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })
  })

  describe('checkout API call', () => {
    it('calls checkout API with correct parameters', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { url: 'https://checkout.stripe.com/session', sessionId: 'sess_123' } }),
      })
      render(
        <CheckoutButton priceId="price_essential_monthly" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(mockFetch).toHaveBeenCalledWith(
          'http://localhost:3000/api/billing/checkout',
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            credentials: 'include',
            body: expect.stringContaining('price_essential_monthly'),
          }),
        )
      })
    })

    it('redirects to checkout URL on success', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve({ data: { url: 'https://checkout.stripe.com/session123', sessionId: 'sess_123' } }),
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(mockLocationHref).toHaveBeenCalledWith('https://checkout.stripe.com/session123')
      })
    })
  })

  describe('error handling', () => {
    it('shows error message on API failure', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Payment method declined', code: 'PAYMENT_FAILED' } }),
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(screen.getByTestId('checkout-error')).toHaveTextContent('Payment method declined')
      })
    })

    it('shows error message when API returns NO_ACTIVE_ORG', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' } }),
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(screen.getByTestId('checkout-error')).toHaveTextContent('No active organization selected')
      })
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('shows generic error on network failure', async () => {
      const user = userEvent.setup()
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(screen.getByTestId('checkout-error')).toHaveTextContent('checkout.connectionError')
      })
    })

    it('error message has role alert', async () => {
      const user = userEvent.setup()
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Error occurred', code: 'ERROR' } }),
      })
      render(
        <CheckoutButton priceId="price_123" planName="Essential">
          Get Started
        </CheckoutButton>,
      )
      await user.click(screen.getByTestId('checkout-button'))
      await waitFor(() => {
        expect(screen.getByTestId('checkout-error')).toHaveAttribute('role', 'alert')
      })
    })
  })

  describe('props forwarding', () => {
    it('forwards variant prop to button', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential" variant="outline">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toBeInTheDocument()
    })

    it('respects disabled prop', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential" disabled>
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toBeDisabled()
    })

    it('applies className prop', () => {
      render(
        <CheckoutButton priceId="price_123" planName="Essential" className="w-full">
          Get Started
        </CheckoutButton>,
      )
      expect(screen.getByTestId('checkout-button')).toHaveClass('w-full')
    })
  })
})
