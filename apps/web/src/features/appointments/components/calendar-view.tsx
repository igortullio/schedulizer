import type { AppointmentStatus } from '@schedulizer/shared-types'
import { format, getDay, parse, startOfWeek } from 'date-fns'
import { enUS, ptBR } from 'date-fns/locale'
import { useCallback, useMemo, useState } from 'react'
import { Calendar, dateFnsLocalizer, type View } from 'react-big-calendar'
import { useTranslation } from 'react-i18next'
import 'react-big-calendar/lib/css/react-big-calendar.css'
import type { TimeBlockResponse } from '@/features/time-blocks'
import type { AppointmentResponse } from '../hooks/use-appointments'

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

export function CalendarView({ appointments, timeBlocks, onSelectEvent }: CalendarViewProps) {
  const { t } = useTranslation('appointments')
  const [view, setView] = useState<View>('week')
  const [date, setDate] = useState(new Date())
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
      style: {
        backgroundColor: STATUS_COLORS[event.status],
        borderRadius: '4px',
        opacity: event.status === 'cancelled' || event.status === 'time_block' ? 0.5 : 0.9,
        color: 'white',
        border: 'none',
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
    <div data-testid="calendar-view" style={{ height: 600 }}>
      <Calendar
        localizer={localizer}
        events={events}
        startAccessor="start"
        endAccessor="end"
        view={view}
        onView={setView}
        date={date}
        onNavigate={setDate}
        views={AVAILABLE_VIEWS}
        eventPropGetter={eventPropGetter}
        onSelectEvent={handleSelectEvent}
        messages={{
          today: t('calendar.today'),
          previous: t('calendar.previous'),
          next: t('calendar.next'),
          month: t('calendar.month'),
          week: t('calendar.week'),
          noEventsInRange: t('calendar.noEvents'),
        }}
      />
    </div>
  )
}
