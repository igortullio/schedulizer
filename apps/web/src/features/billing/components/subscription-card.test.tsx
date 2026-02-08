import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Subscription } from '../types'
import { SubscriptionCard } from './subscription-card'

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
      expect(screen.getByText('No Active Subscription')).toBeInTheDocument()
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
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('Active')
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
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('Active')
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
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('Trial')
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
      expect(screen.getByTestId('subscription-status')).toHaveTextContent('Past Due')
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
