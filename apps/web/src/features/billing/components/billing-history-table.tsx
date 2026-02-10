import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@schedulizer/ui'
import { Download, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCurrency, formatDateShort } from '@/lib/format'
import type { Invoice } from '../types'

interface BillingHistoryTableProps {
  invoices: Invoice[]
  isLoading: boolean
  error: string | null
  onRetry: () => void
}

type InvoiceStatus = 'paid' | 'open' | 'draft' | 'void' | 'uncollectible'
type StatusVariant = 'success' | 'warning' | 'secondary' | 'destructive'

function getInvoiceStatusVariant(status: string): StatusVariant {
  const statusVariants: Record<InvoiceStatus, StatusVariant> = {
    paid: 'success',
    open: 'warning',
    draft: 'secondary',
    void: 'destructive',
    uncollectible: 'destructive',
  }
  return statusVariants[status as InvoiceStatus] ?? 'secondary'
}

function BillingHistoryTableSkeleton() {
  return (
    <Card data-testid="billing-history-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
          <div className="flex items-center justify-between py-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function EmptyInvoices() {
  const { t } = useTranslation('billing')
  return (
    <Card data-testid="billing-history-empty">
      <CardHeader>
        <CardTitle>{t('subscription.billingHistory.title')}</CardTitle>
        <CardDescription>{t('subscription.billingHistory.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">{t('subscription.billingHistory.empty')}</p>
      </CardContent>
    </Card>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  const { t } = useTranslation('billing')
  return (
    <Card data-testid="billing-history-error">
      <CardHeader>
        <CardTitle>{t('subscription.billingHistory.title')}</CardTitle>
        <CardDescription>{t('subscription.billingHistory.description')}</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-sm text-destructive">{t('subscription.billingHistory.errorLoading')}</p>
        <Button onClick={onRetry} variant="outline" data-testid="retry-button">
          {t('subscription.billingHistory.tryAgain')}
        </Button>
      </CardContent>
    </Card>
  )
}

export function BillingHistoryTable({ invoices, isLoading, error, onRetry }: BillingHistoryTableProps) {
  const { t, i18n } = useTranslation('billing')
  if (isLoading) {
    return <BillingHistoryTableSkeleton />
  }
  if (error) {
    return <ErrorState onRetry={onRetry} />
  }
  if (invoices.length === 0) {
    return <EmptyInvoices />
  }
  return (
    <Card data-testid="billing-history-table">
      <CardHeader>
        <CardTitle>{t('subscription.billingHistory.title')}</CardTitle>
        <CardDescription>{t('subscription.billingHistory.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t('subscription.billingHistory.columns.date')}</TableHead>
              <TableHead>{t('subscription.billingHistory.columns.amount')}</TableHead>
              <TableHead>{t('subscription.billingHistory.columns.status')}</TableHead>
              <TableHead className="text-right">{t('subscription.billingHistory.columns.invoice')}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                <TableCell data-testid="invoice-date">{formatDateShort(invoice.created, i18n.language)}</TableCell>
                <TableCell data-testid="invoice-amount">
                  {formatCurrency(invoice.amountPaid || invoice.amountDue, invoice.currency, i18n.language)}
                </TableCell>
                <TableCell>
                  <Badge variant={getInvoiceStatusVariant(invoice.status ?? '')} data-testid="invoice-status">
                    {invoice.status ?? 'Unknown'}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    {invoice.invoicePdf ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid="download-invoice-button"
                        aria-label="Download PDF"
                      >
                        <a href={invoice.invoicePdf} target="_blank" rel="noopener noreferrer">
                          <Download className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                    {invoice.hostedInvoiceUrl ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        asChild
                        data-testid="view-invoice-button"
                        aria-label="View invoice"
                      >
                        <a href={invoice.hostedInvoiceUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    ) : null}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
