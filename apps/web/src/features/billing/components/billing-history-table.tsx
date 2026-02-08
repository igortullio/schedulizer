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

function formatCurrency(amount: number, currency: string): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100)
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
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
  return (
    <Card data-testid="billing-history-empty">
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>Your past invoices and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-center text-sm text-muted-foreground">No invoices yet</p>
      </CardContent>
    </Card>
  )
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <Card data-testid="billing-history-error">
      <CardHeader>
        <CardTitle>Billing History</CardTitle>
        <CardDescription>Your past invoices and payment history</CardDescription>
      </CardHeader>
      <CardContent className="text-center">
        <p className="mb-4 text-sm text-destructive">Failed to load billing history</p>
        <Button onClick={onRetry} variant="outline" data-testid="retry-button">
          Try Again
        </Button>
      </CardContent>
    </Card>
  )
}

export function BillingHistoryTable({ invoices, isLoading, error, onRetry }: BillingHistoryTableProps) {
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
        <CardTitle>Billing History</CardTitle>
        <CardDescription>Your past invoices and payment history</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Invoice</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map(invoice => (
              <TableRow key={invoice.id} data-testid={`invoice-row-${invoice.id}`}>
                <TableCell data-testid="invoice-date">{formatDate(invoice.created)}</TableCell>
                <TableCell data-testid="invoice-amount">
                  {formatCurrency(invoice.amountPaid || invoice.amountDue, invoice.currency)}
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
