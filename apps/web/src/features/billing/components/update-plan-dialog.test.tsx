import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { UpdatePlanDialog } from './update-plan-dialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

describe('UpdatePlanDialog', () => {
  describe('when closed', () => {
    it('does not render dialog content when closed', () => {
      render(<UpdatePlanDialog isOpen={false} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />)
      expect(screen.queryByTestId('update-plan-dialog')).not.toBeInTheDocument()
    })
  })

  describe('when open', () => {
    it('renders dialog content', () => {
      render(<UpdatePlanDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />)
      expect(screen.getByTestId('update-plan-dialog')).toBeInTheDocument()
      expect(screen.getByText('subscription.updatePlanDialog.title')).toBeInTheDocument()
    })

    it('displays upgrade options', () => {
      render(<UpdatePlanDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={false} />)
      expect(screen.getByText('subscription.updatePlanDialog.description')).toBeInTheDocument()
    })

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(<UpdatePlanDialog isOpen={true} onClose={onClose} onConfirm={vi.fn()} isLoading={false} />)
      await user.click(screen.getByTestId('cancel-update-button'))
      expect(onClose).toHaveBeenCalled()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(<UpdatePlanDialog isOpen={true} onClose={vi.fn()} onConfirm={onConfirm} isLoading={false} />)
      await user.click(screen.getByTestId('confirm-update-button'))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('disables buttons when loading', () => {
      render(<UpdatePlanDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={true} />)
      expect(screen.getByTestId('cancel-update-button')).toBeDisabled()
      expect(screen.getByTestId('confirm-update-button')).toBeDisabled()
    })

    it('shows loading state when loading', () => {
      render(<UpdatePlanDialog isOpen={true} onClose={vi.fn()} onConfirm={vi.fn()} isLoading={true} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
