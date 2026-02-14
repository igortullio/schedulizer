import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
}))

import type { BookingService } from '../hooks/use-booking-page'
import type { TimeSlot } from '../hooks/use-slots'
import { BookingForm } from './booking-form'

const mockService: BookingService = {
  id: 'srv-1',
  name: 'Haircut',
  description: 'A professional haircut',
  durationMinutes: 30,
  price: '50.00',
}

const mockSlot: TimeSlot = {
  startTime: '2025-01-15T09:00:00Z',
  endTime: '2025-01-15T09:30:00Z',
}

const defaultProps = {
  service: mockService,
  slot: mockSlot,
  isSubmitting: false,
  error: null,
  onSubmit: vi.fn(),
  onBack: vi.fn(),
}

function submitForm() {
  fireEvent.submit(screen.getByTestId('booking-form'))
}

describe('BookingForm', () => {
  it('renders form with all input fields', () => {
    render(<BookingForm {...defaultProps} />)
    expect(screen.getByTestId('booking-form')).toBeInTheDocument()
    expect(screen.getByTestId('customer-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('customer-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('customer-phone-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-booking')).toBeInTheDocument()
  })

  it('displays service name in summary', () => {
    render(<BookingForm {...defaultProps} />)
    expect(screen.getByText('Haircut')).toBeInTheDocument()
  })

  it('calls onBack when back button is clicked', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<BookingForm {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByTestId('back-to-slots'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows validation error when name is empty', () => {
    const onSubmit = vi.fn()
    render(<BookingForm {...defaultProps} onSubmit={onSubmit} />)
    submitForm()
    expect(screen.getByTestId('form-error')).toHaveTextContent('form.errors.nameRequired')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for invalid email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BookingForm {...defaultProps} onSubmit={onSubmit} />)
    await user.type(screen.getByTestId('customer-name-input'), 'John Doe')
    await user.type(screen.getByTestId('customer-email-input'), 'invalid-email')
    submitForm()
    expect(screen.getByTestId('form-error')).toHaveTextContent('form.errors.emailInvalid')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows validation error for short phone number', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BookingForm {...defaultProps} onSubmit={onSubmit} />)
    await user.type(screen.getByTestId('customer-name-input'), 'John Doe')
    await user.type(screen.getByTestId('customer-email-input'), 'john@example.com')
    await user.type(screen.getByTestId('customer-phone-input'), '123')
    submitForm()
    expect(screen.getByTestId('form-error')).toHaveTextContent('form.errors.phoneInvalid')
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BookingForm {...defaultProps} onSubmit={onSubmit} />)
    await user.type(screen.getByTestId('customer-name-input'), 'John Doe')
    await user.type(screen.getByTestId('customer-email-input'), 'john@example.com')
    await user.type(screen.getByTestId('customer-phone-input'), '11999999999')
    submitForm()
    expect(onSubmit).toHaveBeenCalledWith({
      customerName: 'John Doe',
      customerEmail: 'john@example.com',
      customerPhone: '11999999999',
    })
  })

  it('disables submit button when isSubmitting is true', () => {
    render(<BookingForm {...defaultProps} isSubmitting={true} />)
    expect(screen.getByTestId('submit-booking')).toBeDisabled()
  })

  it('displays external error', () => {
    render(<BookingForm {...defaultProps} error="Slot no longer available" />)
    expect(screen.getByTestId('form-error')).toHaveTextContent('Slot no longer available')
  })

  it('clears validation error on re-submit with valid data', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<BookingForm {...defaultProps} onSubmit={onSubmit} />)
    submitForm()
    expect(screen.getByTestId('form-error')).toBeInTheDocument()
    await user.type(screen.getByTestId('customer-name-input'), 'John Doe')
    await user.type(screen.getByTestId('customer-email-input'), 'john@example.com')
    await user.type(screen.getByTestId('customer-phone-input'), '11999999999')
    submitForm()
    expect(screen.queryByTestId('form-error')).not.toBeInTheDocument()
    expect(onSubmit).toHaveBeenCalled()
  })
})
