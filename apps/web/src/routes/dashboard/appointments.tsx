import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@igortullio-ui/react'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { CalendarDays, List, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AppointmentCard, CalendarView, useAppointments } from '@/features/appointments'

type ViewMode = 'list' | 'calendar'

const STATUS_OPTIONS: (AppointmentStatus | 'all')[] = [
  'all',
  'pending',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]

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
  const [viewMode, setViewMode] = useState<ViewMode>('list')
  const isLoading = state === 'loading'
  function handleStatusFilter(value: string) {
    setFilters({ ...filters, status: value === 'all' ? undefined : (value as AppointmentStatus) })
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
  return (
    <div>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('list')}
            data-testid="view-list-button"
          >
            <List className="h-4 w-4" aria-hidden="true" />
            {t('viewList')}
          </Button>
          <Button
            variant={viewMode === 'calendar' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('calendar')}
            data-testid="view-calendar-button"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t('viewCalendar')}
          </Button>
        </div>
      </div>
      <div className="mb-6 flex flex-wrap items-center gap-4">
        <Select value={filters.status ?? 'all'} onValueChange={handleStatusFilter}>
          <SelectTrigger className="w-48" data-testid="status-filter">
            <SelectValue placeholder={t('filters.allStatuses')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map(status => (
              <SelectItem key={status} value={status}>
                {status === 'all' ? t('filters.allStatuses') : t(`status.${status}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive" data-testid="error-message">
          {error}
        </div>
      ) : viewMode === 'calendar' ? (
        <CalendarView appointments={appointments} />
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
