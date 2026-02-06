import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as VerifyPage } from './verify'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    magicLink: {
      verify: vi.fn(),
    },
  },
}))

import { authClient } from '@/lib/auth-client'

const mockVerify = vi.mocked(authClient.magicLink.verify)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRouter(initialEntry: string) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/auth/verify" element={<VerifyPage />} />
        <Route path="/auth/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/auth/org-select" element={<div data-testid="org-select-page">Org Select Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VerifyPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('loading state', () => {
    it('renders loading state initially while verifying', async () => {
      mockVerify.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { session: {} }, error: null }), 100)),
      )
      renderWithRouter('/auth/verify?token=valid-token')
      expect(screen.getByTestId('verify-loading')).toBeInTheDocument()
      expect(screen.getByText('Verifying your link')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we verify your magic link...')).toBeInTheDocument()
    })

    it('shows loading spinner animation', async () => {
      mockVerify.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { session: {} }, error: null }), 100)),
      )
      renderWithRouter('/auth/verify?token=valid-token')
      const spinner = screen.getByTestId('verify-loading').querySelector('svg')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('token extraction', () => {
    it('calls magicLink.verify with correct token from URL', async () => {
      mockVerify.mockResolvedValueOnce({ data: { session: {} }, error: null })
      renderWithRouter('/auth/verify?token=my-test-token-123')
      await waitFor(() => {
        expect(mockVerify).toHaveBeenCalledWith({
          query: { token: 'my-test-token-123' },
        })
      })
    })

    it('handles missing token query parameter gracefully', async () => {
      renderWithRouter('/auth/verify')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent('Token not found in URL')
      expect(mockVerify).not.toHaveBeenCalled()
    })

    it('handles empty token query parameter', async () => {
      renderWithRouter('/auth/verify?token=')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent('Token not found in URL')
    })
  })

  describe('error handling', () => {
    it('displays error message when token is invalid', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=invalid-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'This link is invalid. Please request a new one.',
      )
    })

    it('displays error message when token is expired', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'EXPIRED_TOKEN', message: 'Token expired', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=expired-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'This link has expired. Please request a new one.',
      )
    })

    it('displays error message when token is not found', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'TOKEN_NOT_FOUND', message: 'Token not found', status: 404, statusText: 'Not Found' },
      })
      renderWithRouter('/auth/verify?token=nonexistent-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'This link is invalid. Please request a new one.',
      )
    })

    it('displays generic error message for unknown error codes', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'UNKNOWN_ERROR', message: 'Unknown error', status: 500, statusText: 'Server Error' },
      })
      renderWithRouter('/auth/verify?token=test-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'This link is invalid or has expired. Please request a new one.',
      )
    })

    it('handles network error during verification', async () => {
      mockVerify.mockRejectedValueOnce(new Error('Network error'))
      renderWithRouter('/auth/verify?token=test-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'An unexpected error occurred. Please try again.',
      )
    })

    it('handles non-Error exceptions during verification', async () => {
      mockVerify.mockRejectedValueOnce('string error')
      renderWithRouter('/auth/verify?token=test-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'An unexpected error occurred. Please try again.',
      )
    })
  })

  describe('back to login link', () => {
    it('shows "back to login" link on error state', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=invalid-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      const backToLoginLink = screen.getByTestId('back-to-login-link')
      expect(backToLoginLink).toBeInTheDocument()
      expect(backToLoginLink).toHaveTextContent('Back to login')
      expect(backToLoginLink).toHaveAttribute('href', '/auth/login')
    })

    it('navigates to login page when clicking back to login link', async () => {
      const user = userEvent.setup()
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=invalid-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      const backToLoginLink = screen.getByTestId('back-to-login-link')
      await user.click(backToLoginLink)
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  describe('successful verification', () => {
    it('redirects to org-select on successful verification', async () => {
      mockVerify.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
        error: null,
      })
      renderWithRouter('/auth/verify?token=valid-token')
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/org-select', { replace: true })
      })
    })

    it('does not show error state on successful verification', async () => {
      mockVerify.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
        error: null,
      })
      renderWithRouter('/auth/verify?token=valid-token')
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalled()
      })
      expect(screen.queryByTestId('verify-error')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('error state has role alert', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=invalid-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error')).toHaveAttribute('role', 'alert')
    })

    it('loading state has proper heading structure', async () => {
      mockVerify.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { session: {} }, error: null }), 100)),
      )
      renderWithRouter('/auth/verify?token=valid-token')
      expect(screen.getByRole('heading', { name: /verifying your link/i })).toBeInTheDocument()
    })

    it('error state has proper heading structure', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'INVALID_TOKEN', message: 'Invalid token', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=invalid-token')
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByRole('heading', { name: /verification failed/i })).toBeInTheDocument()
    })

    it('icons have aria-hidden attribute', async () => {
      mockVerify.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { session: {} }, error: null }), 100)),
      )
      renderWithRouter('/auth/verify?token=valid-token')
      const icons = screen.getByTestId('verify-loading').querySelectorAll('svg')
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })
  })

  describe('integration', () => {
    it('full verification flow with valid token', async () => {
      mockVerify.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123', email: 'test@example.com' } } },
        error: null,
      })
      renderWithRouter('/auth/verify?token=valid-token-123')
      expect(screen.getByTestId('verify-loading')).toBeInTheDocument()
      await waitFor(() => {
        expect(mockVerify).toHaveBeenCalledWith({
          query: { token: 'valid-token-123' },
        })
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/auth/org-select', { replace: true })
      })
    })

    it('error flow with expired token', async () => {
      mockVerify.mockResolvedValueOnce({
        data: null,
        error: { code: 'EXPIRED_TOKEN', message: 'Token expired', status: 401, statusText: 'Unauthorized' },
      })
      renderWithRouter('/auth/verify?token=expired-token-123')
      expect(screen.getByTestId('verify-loading')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.getByTestId('verify-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('verify-error-message')).toHaveTextContent(
        'This link has expired. Please request a new one.',
      )
      expect(screen.getByTestId('back-to-login-link')).toBeInTheDocument()
    })

    it('URL parameter extraction with React Router', async () => {
      mockVerify.mockResolvedValueOnce({
        data: { session: { user: { id: 'user-123' } } },
        error: null,
      })
      renderWithRouter('/auth/verify?token=test-token-abc&other=param')
      await waitFor(() => {
        expect(mockVerify).toHaveBeenCalledWith({
          query: { token: 'test-token-abc' },
        })
      })
    })
  })
})
