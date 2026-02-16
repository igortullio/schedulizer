import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { AppointmentResponse } from '../hooks/use-appointments'
import { CalendarView } from './calendar-view'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const { mockIsMobile } = vi.hoisted(() => ({ mockIsMobile: vi.fn(() => false) }))

vi.mock('@/hooks/use-is-mobile', () => ({
  useIsMobile: mockIsMobile,
}))

const mockAppointments: AppointmentResponse[] = [
  {
    id: 'apt-1',
    organizationId: 'org-1',
    serviceId: 'service-1',
    startDatetime: '2025-06-15T14:00:00.000Z',
    endDatetime: '2025-06-15T14:30:00.000Z',
    status: 'pending',
    customerName: 'John Doe',
    customerEmail: 'john@example.com',
    customerPhone: '11999999999',
    notes: null,
    createdAt: '2025-06-10T10:00:00.000Z',
    updatedAt: '2025-06-10T10:00:00.000Z',
    serviceName: 'Haircut',
  },
  {
    id: 'apt-2',
    organizationId: 'org-1',
    serviceId: 'service-1',
    startDatetime: '2025-06-16T10:00:00.000Z',
    endDatetime: '2025-06-16T10:30:00.000Z',
    status: 'confirmed',
    customerName: 'Jane Doe',
    customerEmail: 'jane@example.com',
    customerPhone: '11888888888',
    notes: null,
    createdAt: '2025-06-10T10:00:00.000Z',
    updatedAt: '2025-06-10T10:00:00.000Z',
    serviceName: 'Haircut',
  },
]

describe('CalendarView', () => {
  it('renders the calendar container', () => {
    render(<CalendarView appointments={[]} />)
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
  })

  it('renders with appointments as events', () => {
    render(<CalendarView appointments={mockAppointments} />)
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
  })

  it('renders toolbar navigation buttons', () => {
    render(<CalendarView appointments={[]} />)
    expect(screen.getByText('calendar.today')).toBeInTheDocument()
    expect(screen.getByText('calendar.previous')).toBeInTheDocument()
    expect(screen.getByText('calendar.next')).toBeInTheDocument()
  })

  it('renders week, month, and day view buttons', () => {
    render(<CalendarView appointments={[]} />)
    expect(screen.getByText('calendar.week')).toBeInTheDocument()
    expect(screen.getByText('calendar.month')).toBeInTheDocument()
    expect(screen.getByText('calendar.day')).toBeInTheDocument()
  })

  it('defaults to day view on mobile', () => {
    mockIsMobile.mockReturnValue(true)
    render(<CalendarView appointments={[]} />)
    const dayButton = screen.getByText('calendar.day')
    expect(dayButton.closest('.rbc-active')).toBeInTheDocument()
    mockIsMobile.mockReturnValue(false)
  })

  it('defaults to week view on desktop', () => {
    render(<CalendarView appointments={[]} />)
    const weekButton = screen.getByText('calendar.week')
    expect(weekButton.closest('.rbc-active')).toBeInTheDocument()
  })

  it('calls onSelectEvent when provided', () => {
    const onSelectEvent = vi.fn()
    render(<CalendarView appointments={mockAppointments} onSelectEvent={onSelectEvent} />)
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
  })

  it('renders with empty appointments', () => {
    render(<CalendarView appointments={[]} />)
    expect(screen.getByTestId('calendar-view')).toBeInTheDocument()
  })
})
