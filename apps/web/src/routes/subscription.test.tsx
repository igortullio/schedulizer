import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as SubscriptionPage } from './subscription'

const mockUseSession = vi.fn()
const mockNavigate = vi.fn()
const mockUseSubscription = vi.fn()
const mockUseBillingHistory = vi.fn()
const mockUseCustomerPortal = vi.fn()

vi.mock('@/lib/auth-client', () => ({
  useSession: () => mockUseSession(),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/billing', () => ({
  SubscriptionCard: ({
    subscription,
    isLoading,
    onManageSubscription,
    isPortalLoading,
  }: {
    subscription: unknown
    isLoading: boolean
    onManageSubscription: () => void
    isPortalLoading: boolean
  }) => (
    <div data-testid="subscription-card">
      {isLoading ? 'Loading...' : subscription ? 'Has subscription' : 'No subscription'}
      <button type="button" onClick={onManageSubscription} disabled={isPortalLoading}>
        Manage
      </button>
    </div>
  ),
  PaymentMethodCard: ({
    onManagePayment,
    isLoading,
    isPortalLoading,
  }: {
    onManagePayment: () => void
    isLoading: boolean
    isPortalLoading: boolean
  }) => (
    <div data-testid="payment-method-card">
      {isLoading ? 'Loading...' : 'Payment method'}
      <button type="button" onClick={onManagePayment} disabled={isPortalLoading}>
        Manage
      </button>
    </div>
  ),
  BillingHistoryTable: ({
    invoices,
    isLoading,
    error,
    onRetry,
  }: {
    invoices: unknown[]
    isLoading: boolean
    error: string | null
    onRetry: () => void
  }) => (
    <div data-testid="billing-history-table">
      {isLoading ? (
        'Loading...'
      ) : error ? (
        <button type="button" onClick={onRetry}>
          Retry
        </button>
      ) : (
        `${invoices.length} invoices`
      )}
    </div>
  ),
  UpdatePlanDialog: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
  }) =>
    isOpen ? (
      <div data-testid="update-plan-dialog">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
  CancelSubscriptionDialog: ({
    isOpen,
    onClose,
    onConfirm,
  }: {
    isOpen: boolean
    onClose: () => void
    onConfirm: () => void
  }) =>
    isOpen ? (
      <div data-testid="cancel-subscription-dialog">
        <button type="button" onClick={onClose}>
          Close
        </button>
        <button type="button" onClick={onConfirm}>
          Confirm
        </button>
      </div>
    ) : null,
  useSubscription: () => mockUseSubscription(),
  useBillingHistory: () => mockUseBillingHistory(),
  useCustomerPortal: () => mockUseCustomerPortal(),
}))

function renderWithRouter(component: React.ReactElement) {
  return render(<MemoryRouter>{component}</MemoryRouter>)
}

describe('SubscriptionPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseSession.mockReturnValue({
      data: { user: { id: 'user-1', email: 'test@example.com' } },
      isPending: false,
    })
    mockUseSubscription.mockReturnValue({
      subscription: {
        id: 'sub-1',
        stripeSubscriptionId: 'sub_123',
        status: 'active',
        plan: 'professional',
        currentPeriodEnd: '2024-02-01T00:00:00Z',
      },
      state: 'success',
      refetch: vi.fn(),
    })
    mockUseBillingHistory.mockReturnValue({
      invoices: [],
      state: 'success',
      error: null,
      refetch: vi.fn(),
    })
    mockUseCustomerPortal.mockReturnValue({
      state: 'idle',
      error: null,
      openPortal: vi.fn(),
    })
  })

  describe('loading state', () => {
    it('shows loading spinner when session is pending', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: true,
      })
      renderWithRouter(<SubscriptionPage />)
      expect(document.querySelector('.animate-spin')).toBeInTheDocument()
    })
  })

  describe('unauthenticated state', () => {
    it('does not render subscription content when not authenticated', () => {
      mockUseSession.mockReturnValue({
        data: null,
        isPending: false,
      })
      renderWithRouter(<SubscriptionPage />)
      expect(screen.queryByText('Subscription Management')).not.toBeInTheDocument()
    })
  })

  describe('authenticated state', () => {
    it('renders subscription management page', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByText('Subscription Management')).toBeInTheDocument()
    })

    it('renders subscription card', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByTestId('subscription-card')).toBeInTheDocument()
    })

    it('renders payment method card', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByTestId('payment-method-card')).toBeInTheDocument()
    })

    it('renders billing history table', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByTestId('billing-history-table')).toBeInTheDocument()
    })

    it('renders back button', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByTestId('back-button')).toBeInTheDocument()
    })

    it('navigates to dashboard when back button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<SubscriptionPage />)
      await user.click(screen.getByTestId('back-button'))
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
    })
  })

  describe('cancel subscription', () => {
    it('shows cancel button for active subscription', () => {
      renderWithRouter(<SubscriptionPage />)
      expect(screen.getByTestId('cancel-subscription-trigger')).toBeInTheDocument()
    })

    it('opens cancel dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<SubscriptionPage />)
      await user.click(screen.getByTestId('cancel-subscription-trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('cancel-subscription-dialog')).toBeInTheDocument()
      })
    })
  })
})
