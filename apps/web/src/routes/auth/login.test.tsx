import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
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
  authClient: {
    phoneNumber: {
      sendOtp: vi.fn(),
    },
  },
  signIn: {
    magicLink: vi.fn(),
  },
  useSession: () => ({ data: null, isPending: false }),
}))

vi.mock('@/components/phone-input', () => ({
  PhoneInput: ({
    value,
    onChange,
    'data-testid': testId,
  }: {
    value: string
    onChange: (v: string) => void
    id?: string
    error?: boolean
    disabled?: boolean
    'data-testid'?: string
  }) => (
    <input data-testid={testId} value={value} onChange={e => onChange(e.target.value)} placeholder="phone" type="tel" />
  ),
}))

vi.mock('@/hooks/use-check-identifier', () => ({
  checkPhoneExists: vi.fn(),
  checkEmailExists: vi.fn(),
}))

import { checkEmailExists, checkPhoneExists } from '@/hooks/use-check-identifier'
import { authClient, signIn } from '@/lib/auth-client'

const mockCheckPhone = vi.mocked(checkPhoneExists)
const mockCheckEmail = vi.mocked(checkEmailExists)
const mockMagicLink = vi.mocked(signIn.magicLink)
const mockSendOtp = vi.mocked(authClient.phoneNumber.sendOtp)

describe('LoginPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('phone mode (default)', () => {
    it('renders phone input by default', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByTestId('phone-input')).toBeInTheDocument()
      expect(screen.queryByTestId('email-input')).not.toBeInTheDocument()
    })

    it('renders WhatsApp submit button', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByTestId('submit-button')).toHaveTextContent('login.continueWithWhatsApp')
    })

    it('shows switch to email link', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByTestId('switch-mode')).toHaveTextContent('login.switchToEmail')
    })

    it('shows phone validation error for empty submission', async () => {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('phone-error')).toHaveTextContent('validation.phoneRequired')
      })
    })

    it('shows WhatsApp success message', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(true)
      mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
      expect(screen.getByText('login.checkYourWhatsApp')).toBeInTheDocument()
    })

    it('calls phoneNumber.sendOtp with correct params', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(true)
      mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '+5511999999999' })
      })
    })

    it('shows name field when phone is new (registration)', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(false)
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument()
      })
    })

    it('does NOT show name field when phone already exists (login)', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(true)
      mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
      expect(screen.queryByTestId('name-input')).not.toBeInTheDocument()
    })

    it('requires name to be filled before sending OTP for new user', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(false)
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument())
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('name-error')).toBeInTheDocument()
      })
      expect(mockSendOtp).not.toHaveBeenCalled()
    })

    it('stores name in localStorage, sends pending name to server, and sends OTP for new user', async () => {
      const mockFetch = vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(null, { status: 204 }))
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(false)
      mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument())
      await user.type(screen.getByTestId('name-input'), 'João Silva')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '+5511999999999' })
      })
      expect(localStorage.getItem('pendingName_+5511999999999')).toBe('João Silva')
      expect(mockFetch).toHaveBeenCalledWith('/api/auth-check/pending-name', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: '+5511999999999', name: 'João Silva' }),
      })
      mockFetch.mockRestore()
    })
  })

  describe('email mode', () => {
    async function switchToEmailMode() {
      const user = userEvent.setup()
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      await user.click(screen.getByTestId('switch-mode'))
      return user
    }

    it('switches to email input when link is clicked', async () => {
      await switchToEmailMode()
      expect(screen.getByTestId('email-input')).toBeInTheDocument()
      expect(screen.queryByTestId('phone-input')).not.toBeInTheDocument()
    })

    it('shows email submit button', async () => {
      await switchToEmailMode()
      expect(screen.getByTestId('submit-button')).toHaveTextContent('login.continueWithEmail')
    })

    it('shows switch to WhatsApp link', async () => {
      await switchToEmailMode()
      expect(screen.getByTestId('switch-mode')).toHaveTextContent('login.switchToWhatsApp')
    })

    it('shows email validation error for empty submission', async () => {
      const user = await switchToEmailMode()
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('email-error')).toHaveTextContent('validation.emailRequired')
      })
    })

    it('shows email success message', async () => {
      const user = await switchToEmailMode()
      mockCheckEmail.mockResolvedValueOnce(true)
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('login-success')).toBeInTheDocument()
      })
      expect(screen.getByText('login.checkYourEmail')).toBeInTheDocument()
    })

    it('calls signIn.magicLink with correct parameters', async () => {
      const user = await switchToEmailMode()
      mockCheckEmail.mockResolvedValueOnce(true)
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'test@example.com')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(mockMagicLink).toHaveBeenCalledWith({
          email: 'test@example.com',
          callbackURL: '/auth/verify',
        })
      })
    })

    it('shows name field when email is new (registration)', async () => {
      const user = await switchToEmailMode()
      mockCheckEmail.mockResolvedValueOnce(false)
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('name-input')).toBeInTheDocument()
      })
    })

    it('encodes name in callbackURL for new email user', async () => {
      const user = await switchToEmailMode()
      mockCheckEmail.mockResolvedValueOnce(false)
      mockMagicLink.mockResolvedValueOnce({ data: null, error: null })
      const emailInput = screen.getByTestId('email-input')
      await user.type(emailInput, 'new@example.com')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument())
      await user.type(screen.getByTestId('name-input'), 'Ana Lima')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(mockMagicLink).toHaveBeenCalledWith({
          email: 'new@example.com',
          callbackURL: '/auth/verify?name=Ana%20Lima',
        })
      })
    })
  })

  describe('error handling', () => {
    it('shows error message when phone OTP request fails', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockResolvedValueOnce(true)
      mockSendOtp.mockResolvedValueOnce({
        data: null,
        error: { message: 'Rate limit exceeded', status: 429, statusText: 'Too Many Requests' },
      })
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('Rate limit exceeded')
      })
    })

    it('shows generic error on unexpected failure', async () => {
      const user = userEvent.setup()
      mockCheckPhone.mockRejectedValueOnce(new Error('Network error'))
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      const phoneInput = screen.getByTestId('phone-input')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+5511999999999')
      await user.click(screen.getByTestId('submit-button'))
      await waitFor(() => {
        expect(screen.getByTestId('form-error')).toHaveTextContent('login.errors.unexpectedError')
      })
    })
  })

  describe('separate accounts warning', () => {
    it('renders separate accounts warning in the login form', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByTestId('separate-accounts-warning')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('has proper form aria-label', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('form', { name: /login form/i })).toBeInTheDocument()
    })

    it('renders welcome heading', () => {
      render(
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>,
      )
      expect(screen.getByRole('heading', { name: 'login.welcomeBack' })).toBeInTheDocument()
    })
  })
})
