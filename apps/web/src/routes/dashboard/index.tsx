import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import { Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { useSubscriptionContext } from '@/contexts/subscription-context'
import { CalendarView, useAppointments } from '@/features/appointments'
import { TimeBlockFormDialog, useTimeBlocks } from '@/features/time-blocks'
import { getLocale } from '@/lib/format'

const DAYS_RANGE = 90
const MAX_CARD_ITEMS = 3

function getTimeBlockRange() {
  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + DAYS_RANGE)
  const to = futureDate.toISOString().split('T')[0]
  return { from, to }
}

function getTodayRange() {
  const today = new Date().toISOString().split('T')[0]
  return { from: today, to: today }
}

function formatTime(datetime: string): string {
  const date = new Date(datetime)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(dateString: string, locale: string): string {
  const [year, month, day] = dateString.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

export function Component() {
  const { t, i18n } = useTranslation('dashboard')
  const { hasActiveSubscription, isLoading: isSubscriptionLoading } = useSubscriptionContext()
  const { appointments, state: appointmentsState } = useAppointments()
  const todayRange = useMemo(getTodayRange, [])
  const timeBlockRange = useMemo(getTimeBlockRange, [])
  const { timeBlocks, state: timeBlocksState, createTimeBlock } = useTimeBlocks(timeBlockRange.from, timeBlockRange.to)
  const isLoading = appointmentsState === 'loading' || timeBlocksState === 'loading'
  const todayAppointments = appointments.filter(a => a.startDatetime.startsWith(todayRange.from))
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const locale = getLocale(i18n.language)
  const [isTimeBlockDialogOpen, setIsTimeBlockDialogOpen] = useState(false)
  const isBlocked = !isSubscriptionLoading && !hasActiveSubscription
  async function handleCreateTimeBlock(data: { date: string; startTime: string; endTime: string; reason?: string }) {
    await createTimeBlock(data)
    setIsTimeBlockDialogOpen(false)
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className="flex min-h-full flex-col gap-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="stats-grid">
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.todayAppointments')}
              <Badge variant="secondary">{todayAppointments.length}</Badge>
            </CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to="/dashboard/appointments">{t('sections.viewAll')}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-3">
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noTodayAppointments')}</p>
            ) : (
              <ul className="space-y-2">
                {todayAppointments.slice(0, MAX_CARD_ITEMS).map(appointment => (
                  <li key={appointment.id}>
                    <p className="truncate text-sm">{appointment.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(appointment.startDatetime)} - {formatTime(appointment.endDatetime)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.pendingAppointments')}
              <Badge variant="secondary">{pendingAppointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            {pendingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noPending')}</p>
            ) : (
              <ul className="space-y-2">
                {pendingAppointments.slice(0, MAX_CARD_ITEMS).map(appointment => (
                  <li key={appointment.id}>
                    <p className="truncate text-sm">
                      {appointment.customerName} - {appointment.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(appointment.startDatetime.split('T')[0], locale)}{' '}
                      {formatTime(appointment.startDatetime)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.activeTimeBlocks')}
              <Badge variant="secondary">{timeBlocks.length}</Badge>
            </CardTitle>
            <CardAction className="flex items-center gap-1">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to="/dashboard/time-blocks">{t('sections.viewAll')}</Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsTimeBlockDialogOpen(true)}
                      disabled={isBlocked}
                      data-testid="dashboard-create-time-block"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('sections.newTimeBlock')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardAction>
          </CardHeader>
          <CardContent className="px-3">
            {timeBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noTimeBlocks')}</p>
            ) : (
              <ul className="space-y-2">
                {timeBlocks.slice(0, MAX_CARD_ITEMS).map(block => (
                  <li key={block.id}>
                    <p className="text-sm">{formatShortDate(block.date, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                    </p>
                    {block.reason ? <p className="truncate text-xs text-muted-foreground">{block.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <CalendarView appointments={appointments} timeBlocks={timeBlocks} />
      <TimeBlockFormDialog
        isOpen={isTimeBlockDialogOpen}
        onClose={() => setIsTimeBlockDialogOpen(false)}
        onSubmit={handleCreateTimeBlock}
      />
    </div>
  )
}

export default Component
