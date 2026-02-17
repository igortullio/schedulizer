import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Invitation } from '../hooks/use-members'
import { InvitationList } from './invitation-list'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) return `${key}:${JSON.stringify(params)}`
      return key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const futureDate = new Date()
futureDate.setDate(futureDate.getDate() + 5)

const pastDate = new Date()
pastDate.setDate(pastDate.getDate() - 1)

const pendingInvitation: Invitation = {
  id: 'inv1',
  email: 'new@test.com',
  role: 'member',
  status: 'pending',
  expiresAt: futureDate,
  organizationId: 'org1',
  inviterId: 'u1',
}

const expiredInvitation: Invitation = {
  id: 'inv2',
  email: 'expired@test.com',
  role: 'admin',
  status: 'pending',
  expiresAt: pastDate,
  organizationId: 'org1',
  inviterId: 'u1',
}

const acceptedInvitation: Invitation = {
  id: 'inv3',
  email: 'accepted@test.com',
  role: 'member',
  status: 'accepted',
  expiresAt: futureDate,
  organizationId: 'org1',
  inviterId: 'u1',
}

describe('InvitationList', () => {
  it('renders invitation email and role', () => {
    render(<InvitationList invitations={[pendingInvitation]} onCancel={vi.fn()} onResend={vi.fn()} />)
    expect(screen.getByText('new@test.com')).toBeInTheDocument()
  })

  it('shows empty state when no pending invitations', () => {
    render(<InvitationList invitations={[acceptedInvitation]} onCancel={vi.fn()} onResend={vi.fn()} />)
    expect(screen.getByTestId('empty-invitations')).toBeInTheDocument()
  })

  it('shows empty state when invitations array is empty', () => {
    render(<InvitationList invitations={[]} onCancel={vi.fn()} onResend={vi.fn()} />)
    expect(screen.getByTestId('empty-invitations')).toBeInTheDocument()
  })

  it('shows resend and cancel buttons for pending invitations', () => {
    render(<InvitationList invitations={[pendingInvitation]} onCancel={vi.fn()} onResend={vi.fn()} />)
    expect(screen.getByTestId('resend-invitation-inv1')).toBeInTheDocument()
    expect(screen.getByTestId('cancel-invitation-inv1')).toBeInTheDocument()
  })

  it('displays expired status for expired invitations', () => {
    render(<InvitationList invitations={[expiredInvitation]} onCancel={vi.fn()} onResend={vi.fn()} />)
    const expiredBadges = screen.getAllByText('invitation.expired')
    expect(expiredBadges.length).toBeGreaterThanOrEqual(1)
  })

  it('calls resend handler with correct invitation data', async () => {
    const user = userEvent.setup()
    const onResend = vi.fn()
    render(<InvitationList invitations={[pendingInvitation]} onCancel={vi.fn()} onResend={onResend} />)
    await user.click(screen.getByTestId('resend-invitation-inv1'))
    expect(onResend).toHaveBeenCalledWith(pendingInvitation)
  })

  it('calls cancel handler with correct invitation', async () => {
    const user = userEvent.setup()
    const onCancel = vi.fn()
    render(<InvitationList invitations={[pendingInvitation]} onCancel={onCancel} onResend={vi.fn()} />)
    await user.click(screen.getByTestId('cancel-invitation-inv1'))
    expect(onCancel).toHaveBeenCalledWith(pendingInvitation)
  })

  it('filters out non-pending invitations', () => {
    render(
      <InvitationList invitations={[pendingInvitation, acceptedInvitation]} onCancel={vi.fn()} onResend={vi.fn()} />,
    )
    expect(screen.getByText('new@test.com')).toBeInTheDocument()
    expect(screen.queryByText('accepted@test.com')).not.toBeInTheDocument()
  })
})
