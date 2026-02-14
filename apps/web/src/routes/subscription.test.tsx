import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as SettingsPage } from './dashboard/settings'

const mockNavigate = vi.fn()
const mockUseSubscription = vi.fn()
const mockUseBillingHistory = vi.fn()
const mockUseCustomerPortal = vi.fn()
const mockUseOrganizationSettings = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

vi.mock('@/features/settings', () => ({
  useOrganizationSettings: () => mockUseOrganizationSettings(),
}))

vi.mock('@/features/billing', () => ({
  SubscriptionCard: ({
    subscription,
    isLoading,
    onManageSubscription,
    isPortalLoading,
    onCancelSubscription,
  }: {
    subscription: unknown
    isLoading: boolean
    onManageSubscription: () => void
    isPortalLoading: boolean
    onCancelSubscription?: () => void
  }) => (
    <div data-testid="subscription-card">
      {isLoading ? 'Loading...' : subscription ? 'Has subscription' : 'No subscription'}
      <button type="button" onClick={onManageSubscription} disabled={isPortalLoading}>
        Manage
      </button>
      {onCancelSubscription ? (
        <button type="button" onClick={onCancelSubscription} data-testid="cancel-subscription-trigger">
          Cancel
        </button>
      ) : null}
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

describe('SettingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseOrganizationSettings.mockReturnValue({
      settings: { slug: 'my-org', timezone: 'America/Sao_Paulo' },
      state: 'success',
      updateSettings: vi.fn(),
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

  describe('unified settings page', () => {
    it('renders settings page with title', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByText('title')).toBeInTheDocument()
    })

    it('renders organization settings form', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByTestId('settings-form')).toBeInTheDocument()
    })

    it('renders subscription card', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByTestId('subscription-card')).toBeInTheDocument()
    })

    it('renders payment method card', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByTestId('payment-method-card')).toBeInTheDocument()
    })

    it('renders billing history table', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByTestId('billing-history-table')).toBeInTheDocument()
    })
  })

  describe('cancel subscription', () => {
    it('shows cancel button for active subscription', () => {
      renderWithRouter(<SettingsPage />)
      expect(screen.getByTestId('cancel-subscription-trigger')).toBeInTheDocument()
    })

    it('opens cancel dialog when cancel button is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter(<SettingsPage />)
      await user.click(screen.getByTestId('cancel-subscription-trigger'))
      await waitFor(() => {
        expect(screen.getByTestId('cancel-subscription-dialog')).toBeInTheDocument()
      })
    })
  })
})
