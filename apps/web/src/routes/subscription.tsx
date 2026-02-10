import { Button } from '@schedulizer/ui'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import {
  BillingHistoryTable,
  CancelSubscriptionDialog,
  PaymentMethodCard,
  SubscriptionCard,
  UpdatePlanDialog,
  useBillingHistory,
  useCustomerPortal,
  useSubscription,
} from '@/features/billing'
import { useSession } from '@/lib/auth-client'

export function Component() {
  const { t } = useTranslation('billing')
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { subscription, state: subscriptionState } = useSubscription()
  const { invoices, state: invoicesState, error: invoicesError, refetch: refetchInvoices } = useBillingHistory()
  const { state: portalState, openPortal } = useCustomerPortal()
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const isPortalLoading = portalState === 'loading'
  const isSubscriptionLoading = subscriptionState === 'loading'
  const isInvoicesLoading = invoicesState === 'loading'
  function handleBackToDashboard() {
    navigate('/dashboard')
  }
  function handleManageSubscription() {
    if (!subscription?.stripeSubscriptionId) {
      navigate('/pricing')
      return
    }
    setIsUpdateDialogOpen(true)
  }
  function handleUpdatePlanConfirm() {
    setIsUpdateDialogOpen(false)
    openPortal()
  }
  function handleCancelSubscription() {
    setIsCancelDialogOpen(true)
  }
  function handleCancelSubscriptionConfirm() {
    setIsCancelDialogOpen(false)
    openPortal()
  }
  function handleManagePayment() {
    openPortal()
  }
  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToDashboard} data-testid="back-button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('subscription.backToDashboard')}
          </Button>
        </div>
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('subscription.title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('subscription.description')}</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          <SubscriptionCard
            subscription={subscription}
            isLoading={isSubscriptionLoading}
            onManageSubscription={handleManageSubscription}
            isPortalLoading={isPortalLoading}
          />
          <PaymentMethodCard
            onManagePayment={handleManagePayment}
            isLoading={isSubscriptionLoading}
            isPortalLoading={isPortalLoading}
          />
        </div>
        {subscription?.stripeSubscriptionId && subscription.status === 'active' ? (
          <div className="mt-6">
            <Button
              variant="outline"
              onClick={handleCancelSubscription}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid="cancel-subscription-trigger"
            >
              {t('subscription.cancelSubscription')}
            </Button>
          </div>
        ) : null}
        <div className="mt-8">
          <BillingHistoryTable
            invoices={invoices}
            isLoading={isInvoicesLoading}
            error={invoicesError}
            onRetry={refetchInvoices}
          />
        </div>
        <UpdatePlanDialog
          isOpen={isUpdateDialogOpen}
          onClose={() => setIsUpdateDialogOpen(false)}
          onConfirm={handleUpdatePlanConfirm}
          isLoading={isPortalLoading}
        />
        <CancelSubscriptionDialog
          isOpen={isCancelDialogOpen}
          onClose={() => setIsCancelDialogOpen(false)}
          onConfirm={handleCancelSubscriptionConfirm}
          isLoading={isPortalLoading}
          periodEnd={subscription?.currentPeriodEnd ?? null}
        />
      </div>
    </div>
  )
}

export default Component
