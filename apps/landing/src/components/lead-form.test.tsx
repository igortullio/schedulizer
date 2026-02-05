import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import i18n from 'i18next'
import { I18nextProvider, initReactI18next } from 'react-i18next'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock do clientEnv ANTES de importar o componente
vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

// Mock do ConfirmationModal
let mockModalOpen = false
vi.mock('./confirmation-modal', () => ({
  ConfirmationModal: ({ open, onClose }: { open: boolean; onClose: () => void }) => {
    mockModalOpen = open
    if (!open) return null
    return (
      <button type="button" data-testid="confirmation-modal" onClick={onClose}>
        Modal de confirmação
      </button>
    )
  },
}))

// Configure i18n for tests
const i18nTest = i18n.createInstance()
i18nTest.use(initReactI18next).init({
  lng: 'en',
  fallbackLng: 'en',
  ns: ['common'],
  defaultNS: 'common',
  resources: {
    en: {
      common: {
        leadForm: {
          title: 'Get started',
          titleHighlight: 'now',
          subtitle: 'Fill out the form and we will contact you soon',
          labels: {
            name: 'Full name',
            email: 'Email',
            phone: 'Phone',
            planInterest: 'Plan of interest',
          },
          placeholders: {
            name: 'John Smith',
            email: 'john@email.com',
            phone: '+1 (555) 123-4567',
          },
          options: {
            essential: 'Essential - $49.90/month',
            professional: 'Professional - $99.90/month',
          },
          validation: {
            nameRequired: 'Name is required',
            invalidEmail: 'Invalid email',
            phoneRequired: 'Phone is required',
            invalidPhoneFormat: 'Invalid phone format',
            invalidPlan: 'Plan must be "essential" or "professional"',
          },
          errors: {
            submitError: 'Error submitting form',
            genericError: 'Error submitting form. Please try again.',
          },
          buttons: {
            submit: 'Submit',
            submitting: 'Submitting...',
          },
        },
      },
    },
  },
  interpolation: {
    escapeValue: false,
  },
})

// Importar o componente DEPOIS dos mocks
import { LeadForm } from './lead-form'

// Helper function to render with i18n
const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18nTest}>{component}</I18nextProvider>)
}

describe('LeadForm Component', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    global.fetch = mockFetch
    mockFetch.mockReset()
    mockModalOpen = false
    // REMOVED: vi.useFakeTimers() - causes timeout issues with userEvent
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers() // Ensure timers are reset after tests
  })

  it('should render form with all fields', () => {
    renderWithI18n(<LeadForm />)

    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/plan of interest/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /submit/i })).toBeInTheDocument()
  })

  it('should render with default plan interest', () => {
    renderWithI18n(<LeadForm defaultPlanInterest="professional" />)

    const select = screen.getByLabelText(/plan of interest/i) as HTMLSelectElement
    expect(select.value).toBe('professional')
  })

  it('should update form fields on input change', async () => {
    const user = userEvent.setup()
    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement

    await user.type(nameInput, 'John Smith')
    await user.type(emailInput, 'john@email.com')
    await user.type(phoneInput, '11999999999')

    expect(nameInput.value).toBe('John Smith')
    expect(emailInput.value).toBe('john@email.com')
    expect(phoneInput.value).toBe('11999999999')
  })

  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup()
    renderWithI18n(<LeadForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    // Should show validation errors for all required fields
    await waitFor(() => {
      const errors = screen.queryAllByRole('paragraph')
      const errorTexts = errors.map(el => el.textContent)
      expect(errorTexts.some(text => text?.toLowerCase().includes('name'))).toBe(true)
      expect(errorTexts.some(text => text?.toLowerCase().includes('email'))).toBe(true)
      expect(errorTexts.some(text => text?.toLowerCase().includes('phone'))).toBe(true)
    })

    // Should not call API when validation fails
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should validate field formats', async () => {
    const user = userEvent.setup()
    renderWithI18n(<LeadForm />)

    // Test with invalid inputs
    await user.type(screen.getByLabelText(/full name/i), 'John Smith')
    await user.type(screen.getByLabelText(/email/i), 'invalid-format')
    await user.type(screen.getByLabelText(/phone/i), 'abc')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Validation should prevent API call
    await waitFor(() => {
      expect(mockFetch).not.toHaveBeenCalled()
    })

    // Error messages should appear (check for any error text)
    await waitFor(() => {
      const alerts = screen.queryAllByRole('alert')
      const paragraphs = screen.queryAllByRole('paragraph')
      expect(alerts.length + paragraphs.length).toBeGreaterThan(0)
    })
  })

  it('should clear field error when user starts typing', async () => {
    const user = userEvent.setup()
    renderWithI18n(<LeadForm />)

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'J')

    await waitFor(() => {
      expect(screen.queryByText(/name is required/i)).not.toBeInTheDocument()
    })
  })

  it('should submit form successfully and show confirmation modal', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '123', name: 'John Smith' } }),
    })

    renderWithI18n(<LeadForm onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/leads',
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: 'John Smith',
            email: 'john@email.com',
            phone: '11999999999',
            planInterest: 'essential',
          }),
        }),
      )
    })

    await waitFor(() => {
      expect(mockModalOpen).toBe(true)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  })

  it('should display loading state during submission', async () => {
    const user = userEvent.setup()

    // Mock slow fetch to test loading state
    let resolveFunction: ((value: unknown) => void) | null = null
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFunction = resolve
        }),
    )

    renderWithI18n(<LeadForm />)

    await user.type(screen.getByLabelText(/full name/i), 'John Smith')
    await user.type(screen.getByLabelText(/email/i), 'john@email.com')
    await user.type(screen.getByLabelText(/phone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Check loading state
    expect(screen.getByRole('button', { name: /submitting/i })).toBeDisabled()
    expect(screen.getByLabelText(/full name/i)).toBeDisabled()
    expect(screen.getByLabelText(/email/i)).toBeDisabled()
    expect(screen.getByLabelText(/phone/i)).toBeDisabled()

    // Resolve fetch
    if (resolveFunction) {
      resolveFunction({
        ok: true,
        json: async () => ({ data: { id: '123' } }),
      })
    }

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /submit/i })).not.toBeDisabled()
    })
  })

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '123' } }),
    })

    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i) as HTMLInputElement
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i) as HTMLInputElement
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i) as HTMLInputElement
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(nameInput.value).toBe('')
      expect(emailInput.value).toBe('')
      expect(phoneInput.value).toBe('')
    })
  })

  it('should display error message for server errors', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    })

    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(await screen.findByText(/internal server error/i)).toBeInTheDocument()
  })

  it('should display error message for network errors with retries', async () => {
    const user = userEvent.setup()

    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    renderWithI18n(<LeadForm />)

    await user.type(screen.getByLabelText(/full name/i), 'John Smith')
    await user.type(screen.getByLabelText(/email/i), 'john@email.com')
    await user.type(screen.getByLabelText(/phone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Wait for error to appear after retries
    await waitFor(
      () => {
        expect(screen.getByText(/failed to fetch/i)).toBeInTheDocument()
      },
      { timeout: 6000 },
    )

    // Should have retried (at least 2 calls minimum)
    expect(mockFetch.mock.calls.length).toBeGreaterThanOrEqual(2)
  }, 10000)

  it('should retry on network error and succeed on second attempt', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch')).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '123' } }),
    })

    renderWithI18n(<LeadForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/full name/i), 'John Smith')
    await user.type(screen.getByLabelText(/email/i), 'john@email.com')
    await user.type(screen.getByLabelText(/phone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /submit/i }))

    // Wait for retries to complete
    await waitFor(
      () => {
        expect(mockFetch).toHaveBeenCalledTimes(2)
      },
      { timeout: 3000 },
    )

    await waitFor(() => {
      expect(mockModalOpen).toBe(true)
    })

    expect(onSuccess).toHaveBeenCalledTimes(1)
  }, 6000)

  it('should allow resubmission after error', async () => {
    const user = userEvent.setup()

    mockFetch
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' }),
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: { id: '123' } }),
      })

    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(await screen.findByText(/server error/i)).toBeInTheDocument()

    // Resubmit
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockModalOpen).toBe(true)
    })
  })

  it('should handle malformed server response', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON')
      },
    })

    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(await screen.findByText(/error submitting form/i)).toBeInTheDocument()
  })

  it('should prevent duplicate submissions while loading', async () => {
    const user = userEvent.setup()

    // Mock slow fetch to test duplicate submission prevention
    let resolveFunction: ((value: unknown) => void) | null = null
    mockFetch.mockImplementationOnce(
      () =>
        new Promise(resolve => {
          resolveFunction = resolve
        }),
    )

    renderWithI18n(<LeadForm />)

    await user.type(screen.getByLabelText(/full name/i), 'John Smith')
    await user.type(screen.getByLabelText(/email/i), 'john@email.com')
    await user.type(screen.getByLabelText(/phone/i), '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    expect(submitButton).toBeDisabled()

    // Try to click again while loading
    await user.click(submitButton)

    // Should only call fetch once
    expect(mockFetch).toHaveBeenCalledTimes(1)

    // Resolve fetch
    if (resolveFunction) {
      resolveFunction({
        ok: true,
        json: async () => ({ data: { id: '123' } }),
      })
    }

    await waitFor(() => {
      expect(mockModalOpen).toBe(true)
    })
  })

  it('should close confirmation modal and allow new submission', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({ data: { id: '123' } }),
    })

    renderWithI18n(<LeadForm />)

    const nameInput = screen.getByLabelText(/full name/i)
    await user.type(nameInput, 'John Smith')

    const emailInput = screen.getByLabelText(/email/i)
    await user.type(emailInput, 'john@email.com')

    const phoneInput = screen.getByLabelText(/phone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /submit/i })
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockModalOpen).toBe(true)
    })

    // Close modal
    const modal = screen.getByTestId('confirmation-modal')
    await user.click(modal)

    await waitFor(() => {
      expect(mockModalOpen).toBe(false)
    })

    // Fill and submit again
    await user.type(screen.getByLabelText(/full name/i), 'Mary Johnson')
    await user.type(screen.getByLabelText(/email/i), 'mary@email.com')
    await user.type(screen.getByLabelText(/phone/i), '11988888888')
    await user.click(screen.getByRole('button', { name: /submit/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
