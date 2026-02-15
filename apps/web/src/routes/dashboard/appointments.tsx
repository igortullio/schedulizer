import { Alert, AlertDescription, Badge } from '@igortullio-ui/react'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppointmentCard, useAppointments } from '@/features/appointments'

const STATUS_OPTIONS: (AppointmentStatus | 'all')[] = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

const STATUS_BADGE_CLASSES: Record<AppointmentStatus, string> = {
  pending: 'border-yellow-500 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400',
  confirmed: 'border-blue-500 bg-blue-500/10 text-blue-700 dark:text-blue-400',
  completed: 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400',
  cancelled: 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400',
  no_show: 'border-gray-500 bg-gray-500/10 text-gray-700 dark:text-gray-400',
}

function getBadgeClass(status: AppointmentStatus | 'all', isActive: boolean): string {
  if (status === 'all') {
    return isActive ? 'bg-primary text-primary-foreground' : ''
  }
  return isActive ? STATUS_BADGE_CLASSES[status] : 'opacity-50'
}

export function Component() {
  const { t } = useTranslation('appointments')
  const {
    appointments,
    state,
    error,
    filters,
    setFilters,
    confirmAppointment,
    completeAppointment,
    markNoShow,
    cancelAppointment,
  } = useAppointments()
  const isLoading = state === 'loading'
  function handleStatusFilter(status: AppointmentStatus | 'all') {
    const current = filters.status
    if (status === 'all' || current === status) {
      setFilters({ ...filters, status: undefined })
    } else {
      setFilters({ ...filters, status })
    }
  }
  async function handleConfirm(id: string) {
    try {
      await confirmAppointment(id)
    } catch {
      // Error handled in hook
    }
  }
  async function handleComplete(id: string) {
    try {
      await completeAppointment(id)
    } catch {
      // Error handled in hook
    }
  }
  async function handleNoShow(id: string) {
    try {
      await markNoShow(id)
    } catch {
      // Error handled in hook
    }
  }
  async function handleCancel(id: string) {
    try {
      await cancelAppointment(id)
    } catch {
      // Error handled in hook
    }
  }
  const statusBadges = (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {STATUS_OPTIONS.map(status => {
        const isActive = status === 'all' ? !filters.status : filters.status === status
        const badgeClass = getBadgeClass(status, isActive)
        return (
          <Badge
            key={status}
            variant="outline"
            className={`cursor-pointer transition-all ${badgeClass}`}
            onClick={() => handleStatusFilter(status)}
            data-testid={`status-badge-${status}`}
          >
            {status === 'all' ? t('filters.allStatuses') : t(`status.${status}`)}
          </Badge>
        )
      })}
    </div>
  )
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>
      {statusBadges}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="error-message">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : appointments.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-state">
          <p className="text-muted-foreground">{t('emptyState')}</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="appointments-list">
          {appointments.map(appointment => (
            <AppointmentCard
              key={appointment.id}
              id={appointment.id}
              customerName={appointment.customerName}
              customerEmail={appointment.customerEmail}
              customerPhone={appointment.customerPhone}
              serviceName={appointment.serviceName}
              startDatetime={appointment.startDatetime}
              endDatetime={appointment.endDatetime}
              status={appointment.status}
              onConfirm={handleConfirm}
              onComplete={handleComplete}
              onNoShow={handleNoShow}
              onCancel={handleCancel}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Component
