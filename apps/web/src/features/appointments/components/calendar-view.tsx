import type { AppointmentStatus } from '@schedulizer/shared-types'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop'
import { useTranslation } from 'react-i18next'
import type { TimeBlockResponse } from '@/features/time-blocks'
import { useIsMobile } from '@/hooks/use-is-mobile'
import { getLocale } from '@/lib/format'
import type { AppointmentResponse } from '../hooks/use-appointments'
import { useMoveAppointment } from '../hooks/use-move-appointment'
import { ConflictDialog } from './conflict-dialog'
import './calendar-view.css'

const locales = {
  'en-US': enUS,
  'pt-BR': ptBR,
}

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
})

type CalendarEventType = AppointmentStatus | 'time_block'

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: CalendarEventType
  resource?: AppointmentResponse
}

const DragAndDropCalendar = withDragAndDrop<CalendarEvent>(Calendar)

const AVAILABLE_VIEWS: View[] = ['month', 'week', 'day']

const STATUS_COLORS: Record<CalendarEventType, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  no_show: '#6b7280',
  time_block: '#94a3b8',
}

interface CalendarViewProps {
  appointments: AppointmentResponse[]
  timeBlocks?: TimeBlockResponse[]
  onSelectEvent?: (appointment: AppointmentResponse) => void
  onRefetch?: () => void
}

const BUSINESS_START_HOUR = 7

interface EventDropArgs {
  event: CalendarEvent
  start: string | Date
  end: string | Date
}

export function CalendarView({ appointments, timeBlocks, onSelectEvent, onRefetch }: CalendarViewProps) {
  const { t, i18n } = useTranslation('appointments')
  const isMobile = useIsMobile()
  const [view, setView] = useState<View>(isMobile ? 'day' : 'week')
  const [date, setDate] = useState(new Date())
  const culture = getLocale(i18n.language)
  const { state: moveState, conflictingAppointments, moveAppointment, resetState } = useMoveAppointment()
  const [pendingMove, setPendingMove] = useState<{ appointmentId: string; start: Date; end: Date } | null>(null)
  const scrollToTime = useMemo(() => {
    const time = new Date()
    time.setHours(BUSINESS_START_HOUR, 0, 0, 0)
    return time
  }, [])
  const events: CalendarEvent[] = useMemo(() => {
    const appointmentEvents: CalendarEvent[] = appointments.map(appointment => ({
      id: appointment.id,
      title: `${appointment.customerName} - ${appointment.serviceName}`,
      start: new Date(appointment.startDatetime),
      end: new Date(appointment.endDatetime),
      status: appointment.status,
      resource: appointment,
    }))
    const timeBlockEvents: CalendarEvent[] = (timeBlocks ?? []).map(block => ({
      id: block.id,
      title: block.reason ?? t('timeBlock'),
      start: new Date(`${block.date}T${block.startTime}`),
      end: new Date(`${block.date}T${block.endTime}`),
      status: 'time_block' as const,
    }))
    return [...appointmentEvents, ...timeBlockEvents]
  }, [appointments, timeBlocks, t])
  const eventPropGetter = useCallback(
    (event: CalendarEvent) => ({
      className: `rbc-event--${event.status}`,
      style: {
        backgroundColor: STATUS_COLORS[event.status],
      },
    }),
    [],
  )
  const handleSelectEvent = useCallback(
    (event: CalendarEvent) => {
      if (event.resource) {
        onSelectEvent?.(event.resource)
      }
    },
    [onSelectEvent],
  )
  const draggableAccessor = useCallback((event: CalendarEvent) => event.status !== 'time_block', [])
  const handleEventDrop = useCallback(
    async ({ event, start, end }: EventDropArgs) => {
      if (event.status === 'time_block') return
      const startDate = new Date(start)
      const endDate = new Date(end)
      setPendingMove({ appointmentId: event.id, start: startDate, end: endDate })
      const result = await moveAppointment({
        appointmentId: event.id,
        startDatetime: startDate.toISOString(),
        endDatetime: endDate.toISOString(),
      })
      if (result) {
        setPendingMove(null)
        onRefetch?.()
      }
    },
    [moveAppointment, onRefetch],
  )
  const handleConflictConfirm = useCallback(async () => {
    if (!pendingMove) return
    const result = await moveAppointment({
      appointmentId: pendingMove.appointmentId,
      startDatetime: pendingMove.start.toISOString(),
      endDatetime: pendingMove.end.toISOString(),
      force: true,
    })
    if (result) {
      setPendingMove(null)
      resetState()
      onRefetch?.()
    }
  }, [pendingMove, moveAppointment, resetState, onRefetch])
  const handleConflictCancel = useCallback(() => {
    setPendingMove(null)
    resetState()
    onRefetch?.()
  }, [resetState, onRefetch])
  return (
    <div
      data-testid="calendar-view"
      className="schedulizer-calendar min-h-[500px] flex-1 rounded-lg border border-border bg-card"
    >
      <DragAndDropCalendar
        localizer={localizer}
        culture={culture}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={AVAILABLE_VIEWS}
        scrollToTime={scrollToTime}
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
        onEventDrop={handleEventDrop}
        draggableAccessor={draggableAccessor}
        resizable={false}
        messages={{
          today: t('calendar.today'),
          previous: t('calendar.previous'),
          next: t('calendar.next'),
          month: t('calendar.month'),
          week: t('calendar.week'),
          day: t('calendar.day'),
          agenda: t('calendar.agenda'),
          date: t('calendar.date'),
          time: t('calendar.time'),
          event: t('calendar.event'),
          allDay: t('calendar.allDay'),
          noEventsInRange: t('calendar.noEvents'),
          showMore: total => t('calendar.showMore', { count: total }),
        }}
      />
      <ConflictDialog
        isOpen={moveState === 'conflict'}
        conflictingAppointments={conflictingAppointments}
        onConfirm={handleConflictConfirm}
        onCancel={handleConflictCancel}
      />
    </div>
  )
}
