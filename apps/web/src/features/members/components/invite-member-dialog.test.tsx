import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { InviteMemberDialog } from './invite-member-dialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

describe('InviteMemberDialog', () => {
  it('renders email input and role select when open', () => {
    render(<InviteMemberDialog isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('invite-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('invite-role-select')).toBeInTheDocument()
  })

  it('renders dialog title', () => {
    render(<InviteMemberDialog isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByText('inviteDialog.title')).toBeInTheDocument()
  })

  it('submit button is disabled when email is empty', () => {
    render(<InviteMemberDialog isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('submit-invite-button')).toBeDisabled()
  })

  it('submit button is enabled when email is filled', async () => {
    const user = userEvent.setup()
    render(<InviteMemberDialog isOpen={true} onClose={vi.fn()} onSubmit={vi.fn()} />)
    await user.type(screen.getByTestId('invite-email-input'), 'test@test.com')
    expect(screen.getByTestId('submit-invite-button')).not.toBeDisabled()
  })

  it('calls onSubmit with email and default role on form submit', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValueOnce(undefined)
    render(<InviteMemberDialog isOpen={true} onClose={vi.fn()} onSubmit={onSubmit} />)
    await user.type(screen.getByTestId('invite-email-input'), 'test@test.com')
    await user.click(screen.getByTestId('submit-invite-button'))
    expect(onSubmit).toHaveBeenCalledWith('test@test.com', 'member')
  })

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<InviteMemberDialog isOpen={true} onClose={onClose} onSubmit={vi.fn()} />)
    await user.click(screen.getByTestId('cancel-invite-button'))
    expect(onClose).toHaveBeenCalled()
  })
})
