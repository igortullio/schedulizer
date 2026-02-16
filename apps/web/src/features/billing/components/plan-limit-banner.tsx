import { Alert, AlertDescription, Button } from '@igortullio-ui/react'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'

interface PlanLimitBannerProps {
  resource: 'members' | 'services'
  current: number
  limit: number
}

export function PlanLimitBanner({ resource, current, limit }: PlanLimitBannerProps) {
  const { t } = useTranslation('billing')
  const navigate = useNavigate()
  function handleUpgrade() {
    navigate('/pricing?plan=professional')
  }
  return (
    <Alert variant="destructive" className="items-baseline" data-testid={`plan-limit-banner-${resource}`}>
      <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
      <AlertDescription className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-sm text-destructive">
          {t(`planLimitBanner.${resource}` as 'planLimitBanner.members', { current, limit })}
        </span>
        <Button size="sm" onClick={handleUpgrade} data-testid={`upgrade-button-${resource}`}>
          {t('planLimitBanner.upgrade')}
        </Button>
      </AlertDescription>
    </Alert>
  )
}
