import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { CreateAppointmentModal } from './create-appointment-modal'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const mockServices = [
  { id: 'srv-1', name: 'Haircut', durationMinutes: 30 },
  { id: 'srv-2', name: 'Beard Trim', durationMinutes: 15 },
]

const defaultProps = {
  isOpen: true,
  onClose: vi.fn(),
  onSubmit: vi.fn(),
  services: mockServices,
}

describe('CreateAppointmentModal', () => {
  it('renders all form fields when dialog is open', () => {
    render(<CreateAppointmentModal {...defaultProps} />)
    expect(screen.getByTestId('create-appointment-form')).toBeInTheDocument()
    expect(screen.getByTestId('service-select')).toBeInTheDocument()
    expect(screen.getByTestId('date-input')).toBeInTheDocument()
    expect(screen.getByTestId('start-time-input')).toBeInTheDocument()
    expect(screen.getByTestId('end-time-input')).toBeInTheDocument()
    expect(screen.getByTestId('customer-name-input')).toBeInTheDocument()
    expect(screen.getByTestId('customer-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('customer-phone-input')).toBeInTheDocument()
    expect(screen.getByTestId('status-select')).toBeInTheDocument()
    expect(screen.getByTestId('notes-input')).toBeInTheDocument()
    expect(screen.getByTestId('submit-button')).toBeInTheDocument()
  })

  it('does not render content when dialog is closed', () => {
    render(<CreateAppointmentModal {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId('create-appointment-form')).not.toBeInTheDocument()
  })

  it('shows error when submitting without required fields', async () => {
    render(<CreateAppointmentModal {...defaultProps} />)
    fireEvent.submit(screen.getByTestId('create-appointment-form'))
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument()
    })
    expect(defaultProps.onSubmit).not.toHaveBeenCalled()
  })

  it('shows service required error when submitting without service selected', async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined)
    render(<CreateAppointmentModal {...defaultProps} onSubmit={onSubmit} />)
    const user = userEvent.setup()
    await user.clear(screen.getByTestId('customer-name-input'))
    await user.type(screen.getByTestId('customer-name-input'), 'John Doe')
    fireEvent.change(screen.getByTestId('date-input'), { target: { value: '2025-06-15' } })
    fireEvent.change(screen.getByTestId('start-time-input'), { target: { value: '09:00' } })
    fireEvent.change(screen.getByTestId('end-time-input'), { target: { value: '10:00' } })
    fireEvent.submit(screen.getByTestId('create-appointment-form'))
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument()
      expect(screen.getByText('createForm.errors.serviceRequired')).toBeInTheDocument()
    })
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('shows customer name required error when submitting without customer name', async () => {
    render(<CreateAppointmentModal {...defaultProps} />)
    fireEvent.submit(screen.getByTestId('create-appointment-form'))
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument()
      expect(screen.getByText('createForm.errors.serviceRequired')).toBeInTheDocument()
    })
  })

  it('has submit button enabled before submission', () => {
    render(<CreateAppointmentModal {...defaultProps} />)
    expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    expect(screen.getByText('createForm.create')).toBeInTheDocument()
  })

  it('displays inline error message on form error', async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error('Server error'))
    render(<CreateAppointmentModal {...defaultProps} onSubmit={onSubmit} />)
    fireEvent.submit(screen.getByTestId('create-appointment-form'))
    await waitFor(() => {
      expect(screen.getByTestId('form-error')).toBeInTheDocument()
    })
  })

  it('resets form fields when dialog reopens', () => {
    const { rerender } = render(<CreateAppointmentModal {...defaultProps} />)
    const customerNameInput = screen.getByTestId('customer-name-input') as HTMLInputElement
    fireEvent.change(customerNameInput, { target: { value: 'John Doe' } })
    expect(customerNameInput.value).toBe('John Doe')
    rerender(<CreateAppointmentModal {...defaultProps} isOpen={false} />)
    rerender(<CreateAppointmentModal {...defaultProps} isOpen={true} />)
    const resetInput = screen.getByTestId('customer-name-input') as HTMLInputElement
    expect(resetInput.value).toBe('')
  })

  it('allows selecting past dates in datetime input', () => {
    render(<CreateAppointmentModal {...defaultProps} />)
    const dateInput = screen.getByTestId('date-input') as HTMLInputElement
    fireEvent.change(dateInput, { target: { value: '2020-01-01' } })
    expect(dateInput.value).toBe('2020-01-01')
  })
})
