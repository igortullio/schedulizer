import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Subscription } from '../types'
import { SubscriptionCard } from './subscription-card'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('@/lib/format', () => ({
  formatDate: (dateString: string | null) => (dateString ? 'formatted-date' : 'N/A'),
}))

const mockActiveSubscription: Subscription = {
  id: 'sub-1',
  organizationId: 'org-1',
  stripeSubscriptionId: 'sub_123',
  stripePriceId: 'price_123',
  status: 'active',
  plan: 'professional',
  currentPeriodStart: '2024-01-01T00:00:00Z',
  currentPeriodEnd: '2024-02-01T00:00:00Z',
  cancelAtPeriodEnd: false,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  usage: {
    members: { current: 2, limit: 5, canAdd: true },
    services: { current: 3, limit: null, canAdd: true },
  },
  limits: {
    maxMembers: 5,
    maxServices: null,
    notifications: { email: true, whatsapp: true },
  },
}

const mockTrialingSubscription: Subscription = {
  ...mockActiveSubscription,
  status: 'trialing',
}

const mockCanceledSubscription: Subscription = {
  ...mockActiveSubscription,
  status: 'active',
  cancelAtPeriodEnd: true,
}

const mockPastDueSubscription: Subscription = {
  ...mockActiveSubscription,
  status: 'past_due',
}

describe('SubscriptionCard', () => {
  describe('loading state', () => {
    it('renders skeleton when loading', () => {
      render(
        <SubscriptionCard
          subscription={null}
          isLoading={true}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-card-skeleton')).toBeInTheDocument()
    })
  })

  describe('empty state', () => {
    it('renders empty state when no subscription', () => {
      render(
        <SubscriptionCard
          subscription={null}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-card-empty')).toBeInTheDocument()
      expect(screen.getByText('subscription.card.noSubscription.title')).toBeInTheDocument()
    })

    it('calls onManageSubscription when subscribe button is clicked', async () => {
      const user = userEvent.setup()
      const onManageSubscription = vi.fn()
      render(
        <SubscriptionCard
          subscription={null}
          isLoading={false}
          onManageSubscription={onManageSubscription}
          isPortalLoading={false}
        />,
      )
      await user.click(screen.getByTestId('subscribe-button'))
      expect(onManageSubscription).toHaveBeenCalled()
    })
  })

  describe('active subscription', () => {
    it('renders subscription details correctly', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-card')).toBeInTheDocument()
      expect(screen.getByTestId('plan-name')).toHaveTextContent('Professional')
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('subscription.card.status.active')
    })

    it('displays billing period correctly', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('billing-period')).toBeInTheDocument()
    })

    it('displays next billing date', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('next-billing')).toBeInTheDocument()
    })
  })

  describe('status badges', () => {
    it('shows active badge for active subscription', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('subscription.card.status.active')
    })

    it('shows trial badge for trialing subscription', () => {
      render(
        <SubscriptionCard
          subscription={mockTrialingSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('subscription.card.status.trialing')
    })

    it('shows past due badge for past_due subscription', () => {
      render(
        <SubscriptionCard
          subscription={mockPastDueSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('subscription.card.status.past_due')
    })
  })

  describe('cancel warning', () => {
    it('shows cancel warning when cancelAtPeriodEnd is true', () => {
      render(
        <SubscriptionCard
          subscription={mockCanceledSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.getByTestId('cancel-warning')).toBeInTheDocument()
    })

    it('does not show cancel warning when cancelAtPeriodEnd is false', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={false}
        />,
      )
      expect(screen.queryByTestId('cancel-warning')).not.toBeInTheDocument()
    })
  })

  describe('manage subscription button', () => {
    it('calls onManageSubscription when clicked', async () => {
      const user = userEvent.setup()
      const onManageSubscription = vi.fn()
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={onManageSubscription}
          isPortalLoading={false}
        />,
      )
      await user.click(screen.getByTestId('manage-subscription-button'))
      expect(onManageSubscription).toHaveBeenCalled()
    })

    it('disables button when portal is loading', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={true}
        />,
      )
      expect(screen.getByTestId('manage-subscription-button')).toBeDisabled()
    })

    it('shows loading state when portal is loading', () => {
      render(
        <SubscriptionCard
          subscription={mockActiveSubscription}
          isLoading={false}
          onManageSubscription={vi.fn()}
          isPortalLoading={true}
        />,
      )
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
