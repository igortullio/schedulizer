import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@igortullio-ui/react'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { Calendar, Check, Clock, Mail, Phone, User, X, XCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

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

function formatDateTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleString(undefined, {
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
  const { t } = useTranslation('appointments')
  const canConfirm = status === 'pending'
  const canComplete = status === 'confirmed'
  const canNoShow = status === 'confirmed'
  const canCancel = status === 'pending' || status === 'confirmed'
  return (
    <Card data-testid={`appointment-card-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg" data-testid="appointment-service">
            {serviceName}
          </CardTitle>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <User className="h-4 w-4" aria-hidden="true" />
            <span data-testid="appointment-customer">{customerName}</span>
          </div>
        </div>
        <Badge variant={STATUS_VARIANT[status]} data-testid="appointment-status">
          {t(`status.${status}`)}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" data-testid="appointment-datetime">
            <Calendar className="h-4 w-4" aria-hidden="true" />
            <span>{formatDateTime(startDatetime)}</span>
          </div>
          <div className="flex items-center gap-1" data-testid="appointment-time-range">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              {formatTime(startDatetime)} - {formatTime(endDatetime)}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Mail className="h-4 w-4" aria-hidden="true" />
            <span>{customerEmail}</span>
          </div>
          <div className="flex items-center gap-1">
            <Phone className="h-4 w-4" aria-hidden="true" />
            <span>{customerPhone}</span>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {canConfirm ? (
            <Button variant="outline" size="sm" onClick={() => onConfirm(id)} data-testid="confirm-button">
              <Check className="h-4 w-4" aria-hidden="true" />
              {t('actions.confirm')}
            </Button>
          ) : null}
          {canComplete ? (
            <Button variant="outline" size="sm" onClick={() => onComplete(id)} data-testid="complete-button">
              <Check className="h-4 w-4" aria-hidden="true" />
              {t('actions.complete')}
            </Button>
          ) : null}
          {canNoShow ? (
            <Button variant="outline" size="sm" onClick={() => onNoShow(id)} data-testid="no-show-button">
              <XCircle className="h-4 w-4" aria-hidden="true" />
              {t('actions.noShow')}
            </Button>
          ) : null}
          {canCancel ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCancel(id)}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
              data-testid="cancel-button"
            >
              <X className="h-4 w-4" aria-hidden="true" />
              {t('actions.cancel')}
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  )
}
