import { Badge, Button, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@igortullio-ui/react'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { Calendar, Check, Clock, Mail, Phone, User, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocale } from '@/lib/format'

interface AppointmentCardProps {
  id: string
  customerName: string
  customerEmail: string
  customerPhone: string
  serviceName: string
  startDatetime: string
  endDatetime: string
  status: AppointmentStatus
  onConfirm: (id: string) => void
  onComplete: (id: string) => void
  onNoShow: (id: string) => void
  onCancel: (id: string) => void
}

const STATUS_VARIANT: Record<AppointmentStatus, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  pending: 'outline',
  confirmed: 'default',
  completed: 'secondary',
  cancelled: 'destructive',
  no_show: 'destructive',
}

function formatDateTime(isoString: string, locale: string): string {
  const date = new Date(isoString)
  return date.toLocaleDateString(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatTime(isoString: string, locale: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(locale, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function AppointmentCard({
  id,
  customerName,
  customerEmail,
  customerPhone,
  serviceName,
  startDatetime,
  endDatetime,
  status,
  onConfirm,
  onComplete,
  onNoShow,
  onCancel,
}: AppointmentCardProps) {
  const { t, i18n } = useTranslation('appointments')
  const locale = getLocale(i18n.language)
  const canConfirm = status === 'pending'
  const canComplete = status === 'confirmed'
  const canNoShow = status === 'confirmed'
  const canCancel = status === 'pending' || status === 'confirmed'
  return (
    <Card className="px-4 py-3" data-testid={`appointment-card-${id}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium" data-testid="appointment-service">
              {serviceName}
            </span>
            <Badge variant={STATUS_VARIANT[status]} className="shrink-0" data-testid="appointment-status">
              {t(`status.${status}`)}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span className="flex shrink-0 items-center gap-1" data-testid="appointment-customer">
              <User className="h-3 w-3" aria-hidden="true" />
              {customerName}
            </span>
            <span className="flex shrink-0 items-center gap-1" data-testid="appointment-datetime">
              <Calendar className="h-3 w-3" aria-hidden="true" />
              {formatDateTime(startDatetime, locale)}
            </span>
            <span className="flex shrink-0 items-center gap-1" data-testid="appointment-time-range">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {formatTime(startDatetime, locale)} - {formatTime(endDatetime, locale)}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Mail className="h-3 w-3" aria-hidden="true" />
              {customerEmail}
            </span>
            <span className="flex shrink-0 items-center gap-1">
              <Phone className="h-3 w-3" aria-hidden="true" />
              {customerPhone}
            </span>
          </div>
        </div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center">
            {canConfirm ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onConfirm(id)}
                    data-testid="confirm-button"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.confirm')}</TooltipContent>
              </Tooltip>
            ) : null}
            {canComplete ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onComplete(id)}
                    data-testid="complete-button"
                  >
                    <Check className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.complete')}</TooltipContent>
              </Tooltip>
            ) : null}
            {canNoShow ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onNoShow(id)}
                    data-testid="no-show-button"
                  >
                    <XCircle className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.noShow')}</TooltipContent>
              </Tooltip>
            ) : null}
            {canCancel ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => onCancel(id)}
                    data-testid="cancel-button"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.cancel')}</TooltipContent>
              </Tooltip>
            ) : null}
          </div>
        </TooltipProvider>
      </div>
    </Card>
  )
}
