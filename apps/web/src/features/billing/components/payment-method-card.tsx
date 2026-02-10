import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@schedulizer/ui'
import { CreditCard, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PaymentMethodCardProps {
  onManagePayment: () => void
  isLoading: boolean
  isPortalLoading: boolean
}

function PaymentMethodCardSkeleton() {
  return (
    <Card data-testid="payment-method-card-skeleton">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="mt-1 h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-8 w-12" />
          <div className="flex-1">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-1 h-3 w-16" />
          </div>
        </div>
        <Skeleton className="h-9 w-full" />
      </CardContent>
    </Card>
  )
}

export function PaymentMethodCard({ onManagePayment, isLoading, isPortalLoading }: PaymentMethodCardProps) {
  const { t } = useTranslation('billing')
  if (isLoading) {
    return <PaymentMethodCardSkeleton />
  }
  return (
    <Card data-testid="payment-method-card">
      <CardHeader>
        <CardTitle>{t('subscription.paymentMethod.title')}</CardTitle>
        <CardDescription>{t('subscription.paymentMethod.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 rounded-md border border-border p-3">
          <CreditCard className="h-8 w-8 text-muted-foreground" aria-hidden="true" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground" data-testid="payment-method-info">
              {t('subscription.paymentMethod.cardOnFile')}
            </p>
            <p className="text-xs text-muted-foreground">{t('subscription.paymentMethod.managedViaStripe')}</p>
          </div>
        </div>
        <Button
          onClick={onManagePayment}
          variant="outline"
          className="w-full"
          disabled={isPortalLoading}
          data-testid="manage-payment-button"
        >
          {isPortalLoading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              <span>Loading...</span>
            </>
          ) : (
            t('subscription.paymentMethod.updatePaymentMethod')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
