import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as InvitePage } from './index'

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

const mockAcceptInvitation = vi.fn()
const mockSetActive = vi.fn()
let mockSession: { user: { id: string; email: string } } | null = null
let mockSessionPending = false

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      acceptInvitation: (...args: unknown[]) => mockAcceptInvitation(...args),
      setActive: (...args: unknown[]) => mockSetActive(...args),
    },
  },
  signIn: {
    magicLink: vi.fn(),
  },
  useSession: () => ({ data: mockSession, isPending: mockSessionPending }),
}))

import { signIn } from '@/lib/auth-client'

const mockMagicLink = vi.mocked(signIn.magicLink)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

const VALID_INVITATION_ID = '550e8400-e29b-41d4-a716-446655440000'

const validInvitationResponse = {
  data: {
    id: VALID_INVITATION_ID,
    organizationName: 'Test Org',
    inviterName: 'John Doe',
    email: 'invited@test.com',
    role: 'member',
    status: 'pending',
    expiresAt: '2026-02-23T00:00:00Z',
  },
}

function renderWithRouter(invitationId = VALID_INVITATION_ID) {
  return render(
    <MemoryRouter initialEntries={[`/invite/${invitationId}`]}>
      <Routes>
        <Route path="/invite/:id" element={<InvitePage />} />
        <Route path="/dashboard" element={<div data-testid="dashboard-page">Dashboard</div>} />
        <Route path="/auth/login" element={<div data-testid="login-page">Login</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('InvitePage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSession = null
    mockSessionPending = false
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify(validInvitationResponse), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })

  describe('loading state', () => {
    it('renders loading state while fetching invitation data', () => {
      mockSessionPending = true
      renderWithRouter()
      expect(screen.getByTestId('invite-loading')).toBeInTheDocument()
      expect(screen.getByText('loading')).toBeInTheDocument()
    })

    it('shows loading spinner animation', () => {
      mockSessionPending = true
      renderWithRouter()
      const spinner = screen.getByTestId('invite-loading').querySelector('svg')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('logged-out user', () => {
    it('displays invitation details for logged-out user', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-page')).toBeInTheDocument()
      })
      expect(screen.getByText('Test Org')).toBeInTheDocument()
      expect(screen.getByText('invited@test.com')).toBeInTheDocument()
    })

    it('shows magic link sign-in button for logged-out user', async () => {
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-magic-link-button')).toBeInTheDocument()
      })
      expect(screen.getByText('signInToAccept')).toBeInTheDocument()
    })

    it('calls signIn.magicLink with correct email and callbackURL when button is clicked', async () => {
      mockMagicLink.mockResolvedValue({ data: {}, error: null } as never)
      const user = userEvent.setup()
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-magic-link-button')).toBeInTheDocument()
      })
      await user.click(screen.getByTestId('invite-magic-link-button'))
      expect(mockMagicLink).toHaveBeenCalledWith({
        email: 'invited@test.com',
        callbackURL: `/auth/verify?redirect=${encodeURIComponent(`/invite/${VALID_INVITATION_ID}`)}`,
      })
    })

    it('shows success state after magic link is sent', async () => {
      mockMagicLink.mockResolvedValue({ data: {}, error: null } as never)
      const user = userEvent.setup()
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-magic-link-button')).toBeInTheDocument()
      })
      await user.click(screen.getByTestId('invite-magic-link-button'))
      await waitFor(() => {
        expect(screen.getByTestId('invite-magic-link-sent')).toBeInTheDocument()
      })
      expect(screen.getByText('magicLinkSent')).toBeInTheDocument()
    })

    it('shows error when magic link fails', async () => {
      mockMagicLink.mockResolvedValue({ data: null, error: { message: 'Failed' } } as never)
      const user = userEvent.setup()
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-magic-link-button')).toBeInTheDocument()
      })
      await user.click(screen.getByTestId('invite-magic-link-button'))
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.magicLinkFailed')).toBeInTheDocument()
    })
  })

  describe('logged-in user auto-accept', () => {
    it('auto-triggers acceptInvitation when user is logged in', async () => {
      mockSession = { user: { id: 'user-1', email: 'invited@test.com' } }
      mockAcceptInvitation.mockResolvedValue({
        data: { member: { organizationId: 'org-1' } },
        error: null,
      })
      mockSetActive.mockResolvedValue({ data: {}, error: null })
      renderWithRouter()
      await waitFor(() => {
        expect(mockAcceptInvitation).toHaveBeenCalledWith({
          invitationId: VALID_INVITATION_ID,
        })
      })
    })

    it('calls setActive with correct organization ID after acceptance', async () => {
      mockSession = { user: { id: 'user-1', email: 'invited@test.com' } }
      mockAcceptInvitation.mockResolvedValue({
        data: { member: { organizationId: 'org-1' } },
        error: null,
      })
      mockSetActive.mockResolvedValue({ data: {}, error: null })
      renderWithRouter()
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
      })
    })

    it('redirects to /dashboard after successful acceptance', async () => {
      mockSession = { user: { id: 'user-1', email: 'invited@test.com' } }
      mockAcceptInvitation.mockResolvedValue({
        data: { member: { organizationId: 'org-1' } },
        error: null,
      })
      mockSetActive.mockResolvedValue({ data: {}, error: null })
      renderWithRouter()
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('shows error when acceptInvitation fails with email mismatch', async () => {
      mockSession = { user: { id: 'user-1', email: 'other@test.com' } }
      mockAcceptInvitation.mockResolvedValue({
        data: null,
        error: { code: 'EMAIL_MISMATCH', message: 'Email mismatch' },
      })
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.emailMismatch')).toBeInTheDocument()
    })
  })

  describe('error states', () => {
    it('displays expired invitation error when API returns 410 with INVITATION_EXPIRED', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Invitation has expired', code: 'INVITATION_EXPIRED' } }), {
          status: 410,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.expired')).toBeInTheDocument()
    })

    it('displays invalid invitation error when API returns 410 with INVITATION_INVALID', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(
          JSON.stringify({ error: { message: 'Invitation is no longer valid', code: 'INVITATION_INVALID' } }),
          { status: 410, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.invalid')).toBeInTheDocument()
    })

    it('displays not-found error when API returns 404', async () => {
      vi.spyOn(globalThis, 'fetch').mockResolvedValue(
        new Response(JSON.stringify({ error: { message: 'Invitation not found', code: 'NOT_FOUND' } }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.notFound')).toBeInTheDocument()
    })

    it('handles network/fetch errors gracefully', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error')).toBeInTheDocument()
      })
      expect(screen.getByText('errors.fetchFailed')).toBeInTheDocument()
    })

    it('shows go to login button on error state', async () => {
      vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('Network error'))
      renderWithRouter()
      await waitFor(() => {
        expect(screen.getByTestId('invite-error-login-button')).toBeInTheDocument()
      })
    })
  })
})
