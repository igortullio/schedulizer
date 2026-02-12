import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Skeleton,
} from '@igortullio-ui/react'
import { CalendarDays, CreditCard, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/format'
import type { Subscription, SubscriptionStatus } from '../types'

interface SubscriptionCardProps {
  subscription: Subscription | null
  isLoading: boolean
  onManageSubscription: () => void
  isPortalLoading: boolean
}

type BadgeVariant = 'default' | 'secondary' | 'destructive' | 'outline'

interface StatusBadgeConfig {
  variant: BadgeVariant
  className?: string
}

const SUCCESS_BADGE_CLASS = 'border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
const WARNING_BADGE_CLASS = 'border-transparent bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'

function getStatusBadgeConfig(status: SubscriptionStatus): StatusBadgeConfig {
  const statusConfigs: Record<SubscriptionStatus, StatusBadgeConfig> = {
    active: { variant: 'default', className: SUCCESS_BADGE_CLASS },
    trialing: { variant: 'secondary' },
    past_due: { variant: 'default', className: WARNING_BADGE_CLASS },
    canceled: { variant: 'destructive' },
    unpaid: { variant: 'destructive' },
    incomplete: { variant: 'default', className: WARNING_BADGE_CLASS },
    incomplete_expired: { variant: 'destructive' },
    paused: { variant: 'secondary' },
  }
  return statusConfigs[status]
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
  const { t } = useTranslation('billing')
  return (
    <Card data-testid="subscription-card-empty">
      <CardHeader>
        <CardTitle>{t('subscription.card.noSubscription.title')}</CardTitle>
        <CardDescription>{t('subscription.card.noSubscription.description')}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="mb-4 text-sm text-muted-foreground">{t('subscription.card.noSubscription.message')}</p>
        <Button onClick={onManageSubscription} className="w-full" data-testid="subscribe-button">
          {t('subscription.card.noSubscription.cta')}
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
  const { t, i18n } = useTranslation('billing')
  if (isLoading) {
    return <SubscriptionCardSkeleton />
  }
  if (!subscription || !subscription.stripeSubscriptionId) {
    return <NoSubscriptionCard onManageSubscription={onManageSubscription} />
  }
  const showCancelWarning = subscription.cancelAtPeriodEnd && subscription.status === 'active'
  const statusBadge = getStatusBadgeConfig(subscription.status)
  return (
    <Card data-testid="subscription-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle data-testid="plan-name">{formatPlanName(subscription.plan)}</CardTitle>
          <Badge variant={statusBadge.variant} className={statusBadge.className} data-testid="subscription-status">
            {t(`subscription.card.status.${subscription.status}` as 'subscription.card.status.active')}
          </Badge>
        </div>
        <CardDescription>{t('subscription.card.currentPlan')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3 text-sm">
          <CalendarDays className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span data-testid="billing-period">
            {subscription.currentPeriodStart && subscription.currentPeriodEnd
              ? `${formatDate(subscription.currentPeriodStart, i18n.language)} - ${formatDate(subscription.currentPeriodEnd, i18n.language)}`
              : t('subscription.card.noBillingPeriod')}
          </span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <CreditCard className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          <span data-testid="next-billing">
            {t('subscription.card.nextBilling', { date: formatDate(subscription.currentPeriodEnd, i18n.language) })}
          </span>
        </div>
        {showCancelWarning ? (
          <div
            className="rounded-md bg-yellow-50 p-3 text-sm text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200"
            data-testid="cancel-warning"
            role="alert"
          >
            {t('subscription.card.cancelWarning')}
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
            t('subscription.card.manageSubscription')
          )}
        </Button>
      </CardContent>
    </Card>
  )
}
