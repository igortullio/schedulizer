import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '../hooks/use-members'
import { MemberEditDialog } from './member-edit-dialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const testMember: Member = {
  id: 'm1',
  userId: 'u1',
  organizationId: 'org1',
  role: 'member',
  createdAt: new Date('2025-01-01'),
  user: { id: 'u1', name: 'Test User', email: 'test@test.com', phoneNumber: '+1234567890' },
}

const memberWithoutPhone: Member = {
  id: 'm2',
  userId: 'u2',
  organizationId: 'org1',
  role: 'member',
  createdAt: new Date('2025-01-01'),
  user: { id: 'u2', name: 'No Phone', email: 'nophone@test.com' },
}

describe('MemberEditDialog', () => {
  it('renders email and phone fields when dialog is open', () => {
    render(<MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('edit-email-input')).toBeInTheDocument()
    expect(screen.getByTestId('edit-phone-input')).toBeInTheDocument()
  })

  it('does not render content when dialog is closed', () => {
    render(<MemberEditDialog isOpen={false} member={testMember} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.queryByTestId('member-edit-dialog')).not.toBeInTheDocument()
  })

  it('pre-populates fields with member current email and phone number', () => {
    render(<MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('edit-email-input')).toHaveValue('test@test.com')
    expect(screen.getByTestId('edit-phone-input')).toHaveValue('+1234567890')
  })

  it('disables submit button when no fields have been modified', () => {
    render(<MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />)
    expect(screen.getByTestId('submit-edit-button')).toBeDisabled()
  })

  it('calls onSubmit with correct data on valid submission', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn().mockResolvedValueOnce(undefined)
    render(<MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={onSubmit} />)
    const emailInput = screen.getByTestId('edit-email-input')
    await user.clear(emailInput)
    await user.type(emailInput, 'new@test.com')
    await user.click(screen.getByTestId('submit-edit-button'))
    expect(onSubmit).toHaveBeenCalledWith('u1', { email: 'new@test.com' })
  })

  it('shows loading spinner during submission', async () => {
    const user = userEvent.setup()
    let resolveSubmit: () => void
    const submitPromise = new Promise<void>(resolve => {
      resolveSubmit = resolve
    })
    const onSubmit = vi.fn().mockReturnValueOnce(submitPromise)
    render(<MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={onSubmit} />)
    const emailInput = screen.getByTestId('edit-email-input')
    await user.clear(emailInput)
    await user.type(emailInput, 'new@test.com')
    await user.click(screen.getByTestId('submit-edit-button'))
    expect(screen.getByText('editDialog.saving')).toBeInTheDocument()
    resolveSubmit!()
  })

  it('displays inline error message on API error', () => {
    render(
      <MemberEditDialog
        isOpen={true}
        member={testMember}
        error="Validation error"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByTestId('edit-error')).toBeInTheDocument()
    expect(screen.getByText('Validation error')).toBeInTheDocument()
  })

  it('shows specific error message for duplicate email', () => {
    render(
      <MemberEditDialog
        isOpen={true}
        member={testMember}
        error="Email already in use"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText('Email already in use')).toBeInTheDocument()
  })

  it('shows specific error message for duplicate phone', () => {
    render(
      <MemberEditDialog
        isOpen={true}
        member={testMember}
        error="Phone number already in use"
        onClose={vi.fn()}
        onSubmit={vi.fn()}
      />,
    )
    expect(screen.getByText('Phone number already in use')).toBeInTheDocument()
  })

  it('resets form fields to member values when dialog reopens with different member', () => {
    const { rerender } = render(
      <MemberEditDialog isOpen={true} member={testMember} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByTestId('edit-email-input')).toHaveValue('test@test.com')
    rerender(
      <MemberEditDialog isOpen={true} member={memberWithoutPhone} error={null} onClose={vi.fn()} onSubmit={vi.fn()} />,
    )
    expect(screen.getByTestId('edit-email-input')).toHaveValue('nophone@test.com')
    expect(screen.getByTestId('edit-phone-input')).toHaveValue('')
  })
})
