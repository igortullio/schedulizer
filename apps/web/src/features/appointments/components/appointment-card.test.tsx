import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { AppointmentCard } from './appointment-card'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const defaultProps = {
  id: 'apt-1',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  serviceName: 'Haircut',
  startDatetime: '2025-06-15T14:00:00.000Z',
  endDatetime: '2025-06-15T14:30:00.000Z',
  status: 'pending' as const,
  onConfirm: vi.fn(),
  onComplete: vi.fn(),
  onNoShow: vi.fn(),
  onCancel: vi.fn(),
}

describe('AppointmentCard', () => {
  it('renders customer name', () => {
    render(<AppointmentCard {...defaultProps} />)
    expect(screen.getByTestId('appointment-customer')).toHaveTextContent('John Doe')
  })

  it('renders service name', () => {
    render(<AppointmentCard {...defaultProps} />)
    expect(screen.getByTestId('appointment-service')).toHaveTextContent('Haircut')
  })

  it('renders status badge', () => {
    render(<AppointmentCard {...defaultProps} />)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('status.pending')
  })

  it('renders confirmed status badge', () => {
    render(<AppointmentCard {...defaultProps} status="confirmed" />)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('status.confirmed')
  })

  it('renders cancelled status badge', () => {
    render(<AppointmentCard {...defaultProps} status="cancelled" />)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('status.cancelled')
  })

  it('renders completed status badge', () => {
    render(<AppointmentCard {...defaultProps} status="completed" />)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('status.completed')
  })

  it('renders no_show status badge', () => {
    render(<AppointmentCard {...defaultProps} status="no_show" />)
    expect(screen.getByTestId('appointment-status')).toHaveTextContent('status.no_show')
  })

  it('renders date and time', () => {
    render(<AppointmentCard {...defaultProps} />)
    expect(screen.getByTestId('appointment-datetime')).toBeInTheDocument()
    expect(screen.getByTestId('appointment-time-range')).toBeInTheDocument()
  })

  it('shows confirm and cancel buttons for pending status', () => {
    render(<AppointmentCard {...defaultProps} status="pending" />)
    expect(screen.getByTestId('confirm-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-show-button')).not.toBeInTheDocument()
  })

  it('shows complete, no-show, and cancel buttons for confirmed status', () => {
    render(<AppointmentCard {...defaultProps} status="confirmed" />)
    expect(screen.getByTestId('complete-button')).toBeInTheDocument()
    expect(screen.getByTestId('no-show-button')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-button')).toBeInTheDocument()
    expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument()
  })

  it('shows no action buttons for cancelled status', () => {
    render(<AppointmentCard {...defaultProps} status="cancelled" />)
    expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-show-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument()
  })

  it('shows no action buttons for completed status', () => {
    render(<AppointmentCard {...defaultProps} status="completed" />)
    expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-show-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument()
  })

  it('shows no action buttons for no_show status', () => {
    render(<AppointmentCard {...defaultProps} status="no_show" />)
    expect(screen.queryByTestId('confirm-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('complete-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('no-show-button')).not.toBeInTheDocument()
    expect(screen.queryByTestId('cancel-button')).not.toBeInTheDocument()
  })

  it('calls onConfirm when confirm button is clicked', async () => {
    const user = userEvent.setup()
    const onConfirm = vi.fn()
    render(<AppointmentCard {...defaultProps} onConfirm={onConfirm} />)
    await user.click(screen.getByTestId('confirm-button'))
    expect(onConfirm).toHaveBeenCalledWith('apt-1')
  })

  it('calls onComplete when complete button is clicked', async () => {
    const user = userEvent.setup()
    const onComplete = vi.fn()
    render(<AppointmentCard {...defaultProps} status="confirmed" onComplete={onComplete} />)
    await user.click(screen.getByTestId('complete-button'))
    expect(onComplete).toHaveBeenCalledWith('apt-1')
  })

  it('calls onNoShow when no-show button is clicked', async () => {
    const user = userEvent.setup()
    const onNoShow = vi.fn()
    render(<AppointmentCard {...defaultProps} status="confirmed" onNoShow={onNoShow} />)
    await user.click(screen.getByTestId('no-show-button'))
    expect(onNoShow).toHaveBeenCalledWith('apt-1')
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<AppointmentCard {...defaultProps} onCancel={onCancel} />)
    await user.click(screen.getByTestId('cancel-button'))
    expect(onCancel).toHaveBeenCalledWith('apt-1')
  })
})
