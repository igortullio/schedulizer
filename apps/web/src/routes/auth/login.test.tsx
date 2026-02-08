import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as LoginPage } from './login'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  const i18n = {
    changeLanguage: vi.fn(() => Promise.resolve()),
    language: 'pt-BR',
  }
  return {
    useTranslation: () => ({ t, i18n, ready: true }),
    Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
    initReactI18next: {
      type: '3rdParty',
      init: () => {},
    },
  }
})

vi.mock('@/lib/auth-client', () => ({
  signIn: {
    magicLink: vi.fn(),
  },
}))

import { signIn } from '@/lib/auth-client'

const mockMagicLink = vi.mocked(signIn.magicLink)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('rendering', () => {
    it('renders email input field correctly', () => {
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      expect(emailInput).toBeInTheDocument()
      expect(emailInput).toHaveAttribute('type', 'email')
      expect(emailInput).toHaveAttribute('placeholder', 'login.emailPlaceholder')
    })

    it('renders submit button correctly', () => {
      render(<LoginPage />)
      const submitButton = screen.getByTestId('submit-button')
      expect(submitButton).toBeInTheDocument()
      expect(submitButton).toHaveTextContent('login.continueWithEmail')
    })

    it('renders email label correctly', () => {
      render(<LoginPage />)
      const label = screen.getByText('login.email')
      expect(label).toBeInTheDocument()
    })

    it('renders welcome heading', () => {
      render(<LoginPage />)
      expect(screen.getByRole('heading', { name: 'login.welcomeBack' })).toBeInTheDocument()
    })
  })

  describe('form validation', () => {
    it('shows error for empty email submission', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('validation.emailRequired')
      })
    })

    it('shows error for invalid email format', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'invalid-email')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('validation.invalidEmail')
      })
    })

    it('does not show validation error for valid email', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.queryByTestId('email-error')).not.toBeInTheDocument()
      })
    })
  })

  describe('loading state', () => {
    it('disables submit button during loading', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)),
      )
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      expect(submitButton).toBeDisabled()
    })

    it('shows loading indicator during submission', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: null, error: null }), 100)),
      )
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      expect(screen.getByText('login.sendingMagicLink')).toBeInTheDocument()
    })
  })

  describe('success state', () => {
    it('shows success message after magic link is sent', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
      expect(screen.getByText('login.checkYourEmail')).toBeInTheDocument()
      expect(screen.getByText('test@example.com')).toBeInTheDocument()
    })

    it('hides form after successful submission', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('email-input')).not.toBeInTheDocument()
    })
  })

  describe('error handling', () => {
    it('shows error message when magic link request fails', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded', status: 429, statusText: 'Too Many Requests' },
      })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('Rate limit exceeded')
      })
    })

    it('shows generic error message on unexpected failure', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockRejectedValueOnce(new Error('Network error'))
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('login.errors.unexpectedError')
      })
    })

    it('clears error message when user starts typing again', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({
        data: null,
        error: { message: 'Failed', status: 500, statusText: 'Server Error' },
      })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toBeInTheDocument()
      })
      await user.type(emailInput, 'a')
      await waitFor(() => {
        expect(screen.queryByTestId('form-error')).not.toBeInTheDocument()
      })
    })
  })

  describe('accessibility', () => {
    it('has proper form aria-label', () => {
      render(<LoginPage />)
      expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()
    })

    it('has email input with autocomplete attribute', () => {
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      expect(emailInput).toHaveAttribute('autocomplete', 'email')
    })

    it('associates error message with input via aria-describedby', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        const emailInput = screen.getByTestId('email-input')
        expect(emailInput).toHaveAttribute('aria-describedby', 'email-error')
        expect(emailInput).toHaveAttribute('aria-invalid', 'true')
      })
    })

    it('has error message with role alert', async () => {
      const user = userEvent.setup()
      render(<LoginPage />)
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        const errorMessage = screen.getByTestId('email-error')
        expect(errorMessage).toHaveAttribute('role', 'alert')
      })
    })

    it('success state uses semantic output element', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        const successElement = screen.getByTestId('login-success')
        expect(successElement.tagName).toBe('OUTPUT')
      })
    })
  })

  describe('integration', () => {
    it('calls signIn.magicLink with correct parameters', async () => {
      const user = userEvent.setup()
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(mockMagicLink).toHaveBeenCalledWith({
          email: 'test@example.com',
          callbackURL: '/auth/verify',
        })
      })
    })

    it('allows retry after failed request', async () => {
      const user = userEvent.setup()
      mockMagicLink
        .mockResolvedValueOnce({
          data: null,
          error: { message: 'Failed', status: 500, statusText: 'Server Error' },
        })
        .mockResolvedValueOnce({ data: null, error: null })
      render(<LoginPage />)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toBeInTheDocument()
      })
      await user.clear(emailInput)
      await user.type(emailInput, 'test@example.com')
      await user.click(submitButton)
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
    })
  })
})
