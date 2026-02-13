import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Invoice } from '../types'
import { BillingHistoryTable } from './billing-history-table'

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
  formatCurrency: (amountInCents: number, _currency: string) => `$${(amountInCents / 100).toFixed(2)}`,
  formatDateShort: (timestamp: number) => `date-${timestamp}`,
}))

const mockInvoices: Invoice[] = [
  {
    id: 'inv_1',
    number: 'INV-001',
    status: 'paid',
    amountDue: 4990,
    amountPaid: 4990,
    currency: 'usd',
    periodStart: 1704067200,
    periodEnd: 1706745600,
    invoicePdf: 'https://stripe.com/invoice.pdf',
    hostedInvoiceUrl: 'https://stripe.com/invoice',
    created: 1704067200,
  },
  {
    id: 'inv_2',
    number: 'INV-002',
    status: 'open',
    amountDue: 9990,
    amountPaid: 0,
    currency: 'usd',
    periodStart: 1706745600,
    periodEnd: 1709424000,
    invoicePdf: null,
    hostedInvoiceUrl: 'https://stripe.com/invoice2',
    created: 1706745600,
  },
]

describe('BillingHistoryTable', () => {
  describe('loading state', () => {
    it('renders skeleton when loading', () => {
      render(<BillingHistoryTable invoices={[]} isLoading={true} error={null} onRetry={vi.fn()} />)
      expect(screen.getByTestId('billing-history-skeleton')).toBeInTheDocument()
    })
  })

  describe('error state', () => {
    it('renders error state when there is an error', () => {
      render(<BillingHistoryTable invoices={[]} isLoading={false} error="Failed to load" onRetry={vi.fn()} />)
      expect(screen.getByTestId('billing-history-error')).toBeInTheDocument()
      expect(screen.getByText('subscription.billingHistory.errorLoading')).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(<BillingHistoryTable invoices={[]} isLoading={false} error="Failed to load" onRetry={onRetry} />)
      await user.click(screen.getByTestId('retry-button'))
      expect(onRetry).toHaveBeenCalled()
    })
  })

  describe('empty state', () => {
    it('renders empty state when no invoices', () => {
      render(<BillingHistoryTable invoices={[]} isLoading={false} error={null} onRetry={vi.fn()} />)
      expect(screen.getByTestId('billing-history-empty')).toBeInTheDocument()
      expect(screen.getByText('subscription.billingHistory.empty')).toBeInTheDocument()
    })
  })

  describe('with invoices', () => {
    it('renders table with invoices', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      expect(screen.getByTestId('billing-history-table')).toBeInTheDocument()
    })

    it('renders correct number of invoice rows', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      expect(screen.getByTestId('invoice-row-inv_1')).toBeInTheDocument()
      expect(screen.getByTestId('invoice-row-inv_2')).toBeInTheDocument()
    })

    it('displays invoice date correctly', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      const dates = screen.getAllByTestId('invoice-date')
      expect(dates.length).toBe(2)
    })

    it('displays invoice amount correctly', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      const amounts = screen.getAllByTestId('invoice-amount')
      expect(amounts[0]).toHaveTextContent('$49.90')
    })

    it('displays invoice status badge', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      const statuses = screen.getAllByTestId('invoice-status')
      expect(statuses[0]).toHaveTextContent('paid')
      expect(statuses[1]).toHaveTextContent('open')
    })

    it('renders download button when invoicePdf is available', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      expect(screen.getAllByTestId('download-invoice-button').length).toBe(1)
    })

    it('renders view button when hostedInvoiceUrl is available', () => {
      render(<BillingHistoryTable invoices={mockInvoices} isLoading={false} error={null} onRetry={vi.fn()} />)
      expect(screen.getAllByTestId('view-invoice-button').length).toBe(2)
    })
  })
})
