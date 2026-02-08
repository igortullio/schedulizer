import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CancelSubscriptionDialog } from './cancel-subscription-dialog'

const TEST_PERIOD_END = '2024-02-15T12:00:00Z'
function getExpectedDateText(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

describe('CancelSubscriptionDialog', () => {
  describe('when closed', () => {
    it('does not render dialog content when closed', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      expect(screen.queryByTestId('cancel-subscription-dialog')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('renders dialog content', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      expect(screen.getByTestId('cancel-subscription-dialog')).toBeInTheDocument()
      expect(screen.getByRole('heading', { name: /Cancel Subscription/i })).toBeInTheDocument()
    })

    it('displays warning about cancellation', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      expect(screen.getByText(/Your subscription will remain active until/)).toBeInTheDocument()
    })

    it('displays period end date', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      const expectedDate = getExpectedDateText(TEST_PERIOD_END)
      expect(screen.getByText(new RegExp(expectedDate))).toBeInTheDocument()
    })

    it('calls onClose when keep subscription button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={vi.fn()}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      await user.click(screen.getByTestId('keep-subscription-button'))
      expect(onClose).toHaveBeenCalled()
    })

    it('calls onConfirm when cancel subscription button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={onConfirm}
          isLoading={false}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      await user.click(screen.getByTestId('confirm-cancel-button'))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('disables buttons when loading', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={true}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      expect(screen.getByTestId('keep-subscription-button')).toBeDisabled()
      expect(screen.getByTestId('confirm-cancel-button')).toBeDisabled()
    })

    it('shows loading state when loading', () => {
      render(
        <CancelSubscriptionDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          isLoading={true}
          periodEnd={TEST_PERIOD_END}
        />,
      )
      expect(screen.getByText('Canceling...')).toBeInTheDocument()
    })
  })
})
