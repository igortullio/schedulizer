import { Button } from '@igortullio-ui/react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSubscriptionContext } from '@/contexts/subscription-context'

export function SubscriptionBanner() {
  const { t } = useTranslation('common')
  const navigate = useNavigate()
  const { hasActiveSubscription, isLoading } = useSubscriptionContext()
  if (isLoading || hasActiveSubscription) return null
  return (
    <div className="mb-6 flex flex-wrap items-center justify-between gap-2 rounded-lg bg-yellow-50 px-4 py-3 dark:bg-yellow-900/20">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-4 w-4 shrink-0 text-yellow-600 dark:text-yellow-400" aria-hidden="true" />
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">{t('subscription.banner.message')}</p>
      </div>
      <Button size="sm" onClick={() => navigate('/pricing')} data-testid="subscription-banner-cta">
        {t('subscription.banner.cta')}
      </Button>
    </div>
  )
}
