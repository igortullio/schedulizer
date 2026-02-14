import { Alert, AlertDescription, Button, Card, CardContent, CardHeader, CardTitle } from '@igortullio-ui/react'
import { AlertTriangle, CalendarCheck, CalendarX, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import { DateSlotPicker, useManageAppointment, useSlots } from '@/features/booking'
import type { TimeSlot } from '@/features/booking/hooks/use-slots'

type ManageStep = 'details' | 'reschedule'

const ACTIVE_STATUSES = ['pending', 'confirmed']

const STATUS_TRANSLATION_KEYS = {
  pending: 'manage.statuses.pending',
  confirmed: 'manage.statuses.confirmed',
  cancelled: 'manage.statuses.cancelled',
  completed: 'manage.statuses.completed',
  no_show: 'manage.statuses.no_show',
} as const

export function Component() {
  const { slug = '', token = '' } = useParams<{ slug: string; token: string }>()
  const { t, i18n } = useTranslation('booking')
  const { appointment, state, cancelAppointment, rescheduleAppointment } = useManageAppointment(slug, token)
  const { slots, state: slotsState, error: slotsError, fetchSlots } = useSlots()
  const [manageStep, setManageStep] = useState<ManageStep>('details')
  const [isCancelling, setIsCancelling] = useState(false)
  const [isRescheduling, setIsRescheduling] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US'
  async function handleCancel() {
    setActionError(null)
    setIsCancelling(true)
    const success = await cancelAppointment()
    setIsCancelling(false)
    if (!success) {
      setActionError(t('manage.errors.cancelFailed'))
    }
  }
  function handleStartReschedule() {
    setManageStep('reschedule')
  }
  function handleBackToDetails() {
    setManageStep('details')
    setActionError(null)
  }
  async function handleSelectNewSlot(slot: TimeSlot) {
    setActionError(null)
    setIsRescheduling(true)
    const success = await rescheduleAppointment(slot.startTime)
    setIsRescheduling(false)
    if (success) {
      setManageStep('details')
    } else {
      setActionError(t('manage.errors.rescheduleFailed'))
    }
  }
  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (state === 'not-found') {
    return (
      <div className="py-16 text-center" data-testid="manage-not-found">
        <h2 className="text-xl font-semibold text-foreground">{t('manage.notFound.title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('manage.notFound.description')}</p>
      </div>
    )
  }
  if (state === 'error' || !appointment) {
    return (
      <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="manage-error">
        <AlertDescription>{t('error.generic')}</AlertDescription>
      </Alert>
    )
  }
  const startDate = new Date(appointment.startDatetime)
  const endDate = new Date(appointment.endDatetime)
  const isActive = ACTIVE_STATUSES.includes(appointment.status)
  const isCancelled = appointment.status === 'cancelled'
  if (manageStep === 'reschedule' && appointment.id) {
    return (
      <div data-testid="manage-reschedule">
        <h2 className="mb-4 text-xl font-semibold text-foreground">{t('manage.reschedule.title')}</h2>
        {actionError ? (
          <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10" data-testid="reschedule-error">
            <AlertDescription>{actionError}</AlertDescription>
          </Alert>
        ) : null}
        {isRescheduling ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : (
          <DateSlotPicker
            slug={slug}
            serviceId={appointment.serviceId}
            slots={slots}
            slotsState={slotsState}
            slotsError={slotsError}
            onFetchSlots={fetchSlots}
            onSelectSlot={handleSelectNewSlot}
            onBack={handleBackToDetails}
          />
        )}
      </div>
    )
  }
  return (
    <div data-testid="manage-page">
      <div className="mb-6 text-center">
        <div className="mb-4 flex justify-center">
          {isCancelled ? (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
              <CalendarX className="h-8 w-8 text-red-600" aria-hidden="true" />
            </div>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <CalendarCheck className="h-8 w-8 text-green-600" aria-hidden="true" />
            </div>
          )}
        </div>
        <h2 className="text-xl font-semibold text-foreground">
          {isCancelled ? t('manage.cancelled.title') : t('manage.details.title')}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{appointment.customerName}</p>
      </div>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">{t('manage.details.subtitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.service')}</dt>
              <dd className="font-medium text-foreground">{appointment.serviceName}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.date')}</dt>
              <dd className="font-medium text-foreground">
                {startDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.time')}</dt>
              <dd className="font-medium text-foreground">
                {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('manage.details.status')}</dt>
              <dd className="font-medium text-foreground">
                {t(
                  STATUS_TRANSLATION_KEYS[appointment.status as keyof typeof STATUS_TRANSLATION_KEYS] ??
                    'manage.statuses.pending',
                )}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      {actionError ? (
        <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10" data-testid="action-error">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {isActive ? (
        <div className="space-y-2">
          <Button variant="outline" onClick={handleStartReschedule} className="w-full" data-testid="reschedule-button">
            {t('manage.actions.reschedule')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={isCancelling}
            className="w-full"
            data-testid="cancel-button"
          >
            {isCancelling ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('manage.actions.cancelling')}</span>
              </>
            ) : (
              <>
                <AlertTriangle className="h-4 w-4" aria-hidden="true" />
                {t('manage.actions.cancel')}
              </>
            )}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

export default Component
