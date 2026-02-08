import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Skeleton } from '@schedulizer/ui'
import { CalendarDays, CreditCard, Loader2 } from 'lucide-react'
import type { Subscription, SubscriptionStatus } from '../types'

interface SubscriptionCardProps {
  subscription: Subscription | null
  isLoading: boolean
  onManageSubscription: () => void
  isPortalLoading: boolean
}

type StatusVariant = 'success' | 'warning' | 'destructive' | 'secondary' | 'default'

function getStatusVariant(status: SubscriptionStatus): StatusVariant {
  const statusVariants: Record<SubscriptionStatus, StatusVariant> = {
    active: 'success',
    trialing: 'secondary',
    past_due: 'warning',
    canceled: 'destructive',
    unpaid: 'destructive',
    incomplete: 'warning',
    incomplete_expired: 'destructive',
    paused: 'secondary',
  }
  return statusVariants[status]
}

function getStatusLabel(status: SubscriptionStatus): string {
  const statusLabels: Record<SubscriptionStatus, string> = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Past Due',
    canceled: 'Canceled',
    unpaid: 'Unpaid',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    paused: 'Paused',
  }
  return statusLabels[status]
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'N/A'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

function formatPlanName(plan: string | null): string {
  if (!plan) return 'No plan'
  return plan.charAt(0).toUpperCase() + plan.slice(1)
}

function SubscriptionCardSkeleton() {
  return (
    <Card data-testid="subscription-card-skeleton">
      <CardHeader>
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-5 w-16" />
        </div>
        <Skeleton className="mt-1 h-4 w-48" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-40" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-5" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="mt-4 h-9 w-full" />
      </CardContent>
    </Card>
  )
}

function NoSubscriptionCard({ onManageSubscription }: { onManageSubscription: () => void }) {
  return (
    <Card data-testid="subscription-card-empty">
      <CardHeader>
        <CardTitle>No Active Subscription</CardTitle>
        <CardDescription>You don't have an active subscription yet</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">
          Subscribe to a plan to unlock all features and start scheduling.
        </p>
        <Button onClick={onManageSubscription} className="w-full" data-testid="subscribe-button">
          Subscribe Now
        </Button>
      </CardContent>
    </Card>
  )
}

export function SubscriptionCard({
  subscription,
  isLoading,
  onManageSubscription,
  isPortalLoading,
}: SubscriptionCardProps) {
  if (isLoading) {
    return <SubscriptionCardSkeleton />
  }
  if (!subscription || !subscription.stripeSubscriptionId) {
    return <NoSubscriptionCard onManageSubscription={onManageSubscription} />
  }
  const showCancelWarning = subscription.cancelAtPeriodEnd && subscription.status === 'active'
  return (
    <Card data-testid="subscription-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="plan-name">{formatPlanName(subscription.plan)}</CardTitle>
          <Badge variant={getStatusVariant(subscription.status)} data-testid="subscription-status">
            {getStatusLabel(subscription.status)}
          </Badge>
        </div>
        <CardDescription>Your current subscription plan</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span data-testid="billing-period">
            {subscription.currentPeriodStart && subscription.currentPeriodEnd
              ? `${formatDate(subscription.currentPeriodStart)} - ${formatDate(subscription.currentPeriodEnd)}`
              : 'No billing period'}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span data-testid="next-billing">Next billing: {formatDate(subscription.currentPeriodEnd)}</span>
        </div>
        {showCancelWarning ? (
          <div
            className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
            data-testid="cancel-warning"
            role="alert"
          >
            Your subscription will be canceled at the end of the current billing period.
          </div>
        ) : null}
        <Button
          onClick={onManageSubscription}
          variant="outline"
          className="w-full"
          disabled={isPortalLoading}
          data-testid="manage-subscription-button"
        >
          {isPortalLoading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              <span>Loading...</span>
            </>
          ) : (
            'Manage Subscription'
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
