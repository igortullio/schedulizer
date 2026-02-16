import { useTranslation } from 'react-i18next'
import type { ResourceUsage } from '../types'

interface UsageIndicatorProps {
  resource: 'members' | 'services'
  usage: ResourceUsage
}

function getProgressPercentage(current: number, limit: number | null): number {
  if (limit === null) return 0
  if (limit === 0) return 100
  return Math.min(100, (current / limit) * 100)
}

const HIGH_USAGE_THRESHOLD = 80

export function UsageIndicator({ resource, usage }: UsageIndicatorProps) {
  const { t } = useTranslation('billing')
  if (usage.limit === null) return null
  const percentage = getProgressPercentage(usage.current, usage.limit)
  const isHighUsage = percentage >= HIGH_USAGE_THRESHOLD
  const isAtLimit = usage.current >= usage.limit
  return (
    <div className="space-y-1.5" data-testid={`usage-indicator-${resource}`}>
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{t(`usageIndicator.${resource}` as 'usageIndicator.members')}</span>
        <span
          className={`font-medium ${isAtLimit ? 'text-destructive' : isHighUsage ? 'text-yellow-600 dark:text-yellow-400' : 'text-foreground'}`}
          data-testid={`usage-count-${resource}`}
        >
          {t('usageIndicator.limited', { current: usage.current, limit: usage.limit })}
        </span>
      </div>
      <div
        className="h-2 w-full overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={usage.current}
        aria-valuemin={0}
        aria-valuemax={usage.limit}
        data-testid={`usage-progress-${resource}`}
      >
        <div
          className={`h-full rounded-full transition-all ${isAtLimit ? 'bg-destructive' : isHighUsage ? 'bg-yellow-500' : 'bg-primary'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
