import type { AppointmentStatus } from '@schedulizer/shared-types'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import { useTranslation } from 'react-i18next'
import type { TimeBlockResponse } from '@/features/time-blocks'
import { getLocale } from '@/lib/format'
import type { AppointmentResponse } from '../hooks/use-appointments'
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

const AVAILABLE_VIEWS: View[] = ['month', 'week']

type CalendarEventType = AppointmentStatus | 'time_block'

const STATUS_COLORS: Record<CalendarEventType, string> = {
  pending: '#f59e0b',
  confirmed: '#3b82f6',
  completed: '#22c55e',
  cancelled: '#ef4444',
  no_show: '#6b7280',
  time_block: '#94a3b8',
}

interface CalendarEvent {
  id: string
  title: string
  start: Date
  end: Date
  status: CalendarEventType
  resource?: AppointmentResponse
}

interface CalendarViewProps {
  appointments: AppointmentResponse[]
  timeBlocks?: TimeBlockResponse[]
  onSelectEvent?: (appointment: AppointmentResponse) => void
}

const BUSINESS_START_HOUR = 7

export function CalendarView({ appointments, timeBlocks, onSelectEvent }: CalendarViewProps) {
  const { t, i18n } = useTranslation('appointments')
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
  const culture = getLocale(i18n.language)
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
  return (
    <div
      data-testid="calendar-view"
      className="schedulizer-calendar min-h-[500px] flex-1 rounded-lg border border-border bg-card"
    >
      <Calendar
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
    </div>
  )
}
