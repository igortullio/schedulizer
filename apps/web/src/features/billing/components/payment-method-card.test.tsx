import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PaymentMethodCard } from './payment-method-card'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

describe('PaymentMethodCard', () => {
  describe('loading state', () => {
    it('renders skeleton when loading', () => {
      render(<PaymentMethodCard onManagePayment={vi.fn()} isLoading={true} isPortalLoading={false} />)
      expect(screen.getByTestId('payment-method-card-skeleton')).toBeInTheDocument()
    })
  })

  describe('default state', () => {
    it('renders card correctly', () => {
      render(<PaymentMethodCard onManagePayment={vi.fn()} isLoading={false} isPortalLoading={false} />)
      expect(screen.getByTestId('payment-method-card')).toBeInTheDocument()
      expect(screen.getByText('subscription.paymentMethod.title')).toBeInTheDocument()
    })

    it('displays payment method info', () => {
      render(<PaymentMethodCard onManagePayment={vi.fn()} isLoading={false} isPortalLoading={false} />)
      expect(screen.getByTestId('payment-method-info')).toHaveTextContent('subscription.paymentMethod.cardOnFile')
    })
  })

  describe('manage payment button', () => {
    it('calls onManagePayment when clicked', async () => {
      const user = userEvent.setup()
      const onManagePayment = vi.fn()
      render(<PaymentMethodCard onManagePayment={onManagePayment} isLoading={false} isPortalLoading={false} />)
      await user.click(screen.getByTestId('manage-payment-button'))
      expect(onManagePayment).toHaveBeenCalled()
    })

    it('disables button when portal is loading', () => {
      render(<PaymentMethodCard onManagePayment={vi.fn()} isLoading={false} isPortalLoading={true} />)
      expect(screen.getByTestId('manage-payment-button')).toBeDisabled()
    })

    it('shows loading state when portal is loading', () => {
      render(<PaymentMethodCard onManagePayment={vi.fn()} isLoading={false} isPortalLoading={true} />)
      expect(screen.getByText('Loading...')).toBeInTheDocument()
    })
  })
})
