import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
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

// Importar o componente DEPOIS dos mocks
import { LeadForm } from './lead-form'

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
    render(<LeadForm />)

    expect(screen.getByLabelText(/nome completo/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/e-mail/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/telefone/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/plano de interesse/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /enviar/i })).toBeInTheDocument()
  })

  it('should render with default plan interest', () => {
    render(<LeadForm defaultPlanInterest="professional" />)

    const select = screen.getByLabelText(/plano de interesse/i) as HTMLSelectElement
    expect(select.value).toBe('professional')
  })

  it('should update form fields on input change', async () => {
    const user = userEvent.setup()
    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i) as HTMLInputElement
    const emailInput = screen.getByLabelText(/e-mail/i) as HTMLInputElement
    const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement

    await user.type(nameInput, 'João Silva')
    await user.type(emailInput, 'joao@email.com')
    await user.type(phoneInput, '11999999999')

    expect(nameInput.value).toBe('João Silva')
    expect(emailInput.value).toBe('joao@email.com')
    expect(phoneInput.value).toBe('11999999999')
  })

  it('should display validation errors for empty fields', async () => {
    const user = userEvent.setup()
    render(<LeadForm />)

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    // Should show validation errors for all required fields
    await waitFor(() => {
      const errors = screen.queryAllByRole('paragraph')
      const errorTexts = errors.map(el => el.textContent)
      expect(errorTexts.some(text => text?.toLowerCase().includes('nome'))).toBe(true)
      expect(errorTexts.some(text => text?.toLowerCase().includes('email'))).toBe(true)
      expect(errorTexts.some(text => text?.toLowerCase().includes('telefone'))).toBe(true)
    })

    // Should not call API when validation fails
    expect(mockFetch).not.toHaveBeenCalled()
  })

  it('should validate field formats', async () => {
    const user = userEvent.setup()
    render(<LeadForm />)

    // Test with invalid inputs
    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'invalid-format')
    await user.type(screen.getByLabelText(/telefone/i), 'abc')

    await user.click(screen.getByRole('button', { name: /enviar/i }))

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
    render(<LeadForm />)

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    expect(await screen.findByText(/nome é obrigatório/i)).toBeInTheDocument()

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'J')

    await waitFor(() => {
      expect(screen.queryByText(/nome é obrigatório/i)).not.toBeInTheDocument()
    })
  })

  it('should submit form successfully and show confirmation modal', async () => {
    const user = userEvent.setup()
    const onSuccess = vi.fn()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '123', name: 'João Silva' } }),
    })

    render(<LeadForm onSuccess={onSuccess} />)

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
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
            name: 'João Silva',
            email: 'joao@email.com',
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

    render(<LeadForm />)

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@email.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /enviar/i }))

    // Check loading state
    expect(screen.getByRole('button', { name: /enviando/i })).toBeDisabled()
    expect(screen.getByLabelText(/nome completo/i)).toBeDisabled()
    expect(screen.getByLabelText(/e-mail/i)).toBeDisabled()
    expect(screen.getByLabelText(/telefone/i)).toBeDisabled()

    // Resolve fetch
    if (resolveFunction) {
      resolveFunction({
        ok: true,
        json: async () => ({ data: { id: '123' } }),
      })
    }

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /enviar/i })).not.toBeDisabled()
    })
  })

  it('should reset form after successful submission', async () => {
    const user = userEvent.setup()

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ data: { id: '123' } }),
    })

    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i) as HTMLInputElement
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i) as HTMLInputElement
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i) as HTMLInputElement
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
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

    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    expect(await screen.findByText(/internal server error/i)).toBeInTheDocument()
  })

  it('should display error message for network errors with retries', async () => {
    const user = userEvent.setup()

    mockFetch.mockRejectedValue(new TypeError('Failed to fetch'))

    render(<LeadForm />)

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@email.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /enviar/i }))

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

    render(<LeadForm onSuccess={onSuccess} />)

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@email.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')

    await user.click(screen.getByRole('button', { name: /enviar/i }))

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

    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
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

    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
    await user.click(submitButton)

    expect(await screen.findByText(/erro ao enviar formulário/i)).toBeInTheDocument()
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

    render(<LeadForm />)

    await user.type(screen.getByLabelText(/nome completo/i), 'João Silva')
    await user.type(screen.getByLabelText(/e-mail/i), 'joao@email.com')
    await user.type(screen.getByLabelText(/telefone/i), '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
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

    render(<LeadForm />)

    const nameInput = screen.getByLabelText(/nome completo/i)
    await user.type(nameInput, 'João Silva')

    const emailInput = screen.getByLabelText(/e-mail/i)
    await user.type(emailInput, 'joao@email.com')

    const phoneInput = screen.getByLabelText(/telefone/i)
    await user.type(phoneInput, '11999999999')

    const submitButton = screen.getByRole('button', { name: /enviar/i })
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
    await user.type(screen.getByLabelText(/nome completo/i), 'Maria Santos')
    await user.type(screen.getByLabelText(/e-mail/i), 'maria@email.com')
    await user.type(screen.getByLabelText(/telefone/i), '11988888888')
    await user.click(screen.getByRole('button', { name: /enviar/i }))

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledTimes(2)
    })
  })
})
