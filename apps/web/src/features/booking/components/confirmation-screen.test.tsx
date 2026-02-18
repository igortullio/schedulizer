import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockNavigate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

import type { BookingService } from '../hooks/use-booking-page'
import type { AppointmentResult } from '../hooks/use-create-appointment'
import { ConfirmationScreen } from './confirmation-screen'

const mockService: BookingService = {
  id: 'srv-1',
  name: 'Haircut',
  description: 'A professional haircut',
  durationMinutes: 30,
  price: '50.00',
}

const mockAppointment: AppointmentResult = {
  id: 'apt-1',
  startDatetime: '2025-01-15T09:00:00Z',
  endDatetime: '2025-01-15T09:30:00Z',
  status: 'pending',
  managementToken: 'mgmt-token-123',
}

const mockOnBookAgain = vi.fn()

const defaultProps = {
  service: mockService,
  appointment: mockAppointment,
  slug: 'test-org',
  customerName: 'John Doe',
  onBookAgain: mockOnBookAgain,
}

const mockWriteText = vi.fn().mockResolvedValue(undefined)

describe('ConfirmationScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: mockWriteText },
      writable: true,
      configurable: true,
    })
  })

  it('renders confirmation screen with success icon', () => {
    render(<ConfirmationScreen {...defaultProps} />)
    expect(screen.getByTestId('confirmation-screen')).toBeInTheDocument()
    expect(screen.getByText('confirmation.title')).toBeInTheDocument()
  })

  it('displays service name', () => {
    render(<ConfirmationScreen {...defaultProps} />)
    expect(screen.getByText('Haircut')).toBeInTheDocument()
  })

  it('renders copy management link button', () => {
    render(<ConfirmationScreen {...defaultProps} />)
    expect(screen.getByTestId('copy-management-link')).toBeInTheDocument()
    expect(screen.getByText('confirmation.copyLink')).toBeInTheDocument()
  })

  it('renders go to management button', () => {
    render(<ConfirmationScreen {...defaultProps} />)
    expect(screen.getByTestId('go-to-management')).toBeInTheDocument()
    expect(screen.getByText('confirmation.manageBooking')).toBeInTheDocument()
  })

  it('navigates to management page when button is clicked', async () => {
    const user = userEvent.setup()
    render(<ConfirmationScreen {...defaultProps} />)
    await user.click(screen.getByTestId('go-to-management'))
    expect(mockNavigate).toHaveBeenCalledWith('/booking/test-org/manage/mgmt-token-123')
  })

  it('shows copied text after clicking copy button', async () => {
    const user = userEvent.setup()
    render(<ConfirmationScreen {...defaultProps} />)
    await user.click(screen.getByTestId('copy-management-link'))
    await waitFor(() => {
      expect(screen.getByText('confirmation.copied')).toBeInTheDocument()
    })
  })
})
