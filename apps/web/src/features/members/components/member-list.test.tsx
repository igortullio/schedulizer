import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { Member } from '../hooks/use-members'
import { MemberList } from './member-list'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const ownerMember: Member = {
  id: 'm1',
  userId: 'u1',
  organizationId: 'org1',
  role: 'owner',
  createdAt: new Date('2025-01-01'),
  user: { id: 'u1', name: 'Alice Owner', email: 'alice@test.com' },
}

const adminMember: Member = {
  id: 'm2',
  userId: 'u2',
  organizationId: 'org1',
  role: 'admin',
  createdAt: new Date('2025-01-02'),
  user: { id: 'u2', name: 'Bob Admin', email: 'bob@test.com' },
}

const regularMember: Member = {
  id: 'm3',
  userId: 'u3',
  organizationId: 'org1',
  role: 'member',
  createdAt: new Date('2025-01-03'),
  user: { id: 'u3', name: 'Charlie Member', email: 'charlie@test.com' },
}

const allMembers = [ownerMember, adminMember, regularMember]

describe('MemberList', () => {
  it('renders member name, email, and role for each member', () => {
    render(<MemberList members={allMembers} currentUserId="u1" currentUserRole="owner" onRemove={vi.fn()} />)
    expect(screen.getByText('Alice Owner')).toBeInTheDocument()
    expect(screen.getByText('alice@test.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Admin')).toBeInTheDocument()
    expect(screen.getByText('Charlie Member')).toBeInTheDocument()
  })

  it('shows empty state when no members', () => {
    render(<MemberList members={[]} currentUserId="u1" currentUserRole="owner" onRemove={vi.fn()} />)
    expect(screen.getByTestId('empty-members')).toBeInTheDocument()
  })

  it('owner can see remove button for admins and members', () => {
    render(<MemberList members={allMembers} currentUserId="u1" currentUserRole="owner" onRemove={vi.fn()} />)
    expect(screen.getByTestId('remove-member-m2')).toBeInTheDocument()
    expect(screen.getByTestId('remove-member-m3')).toBeInTheDocument()
  })

  it('does not show remove button for the owner role member', () => {
    render(<MemberList members={allMembers} currentUserId="u1" currentUserRole="owner" onRemove={vi.fn()} />)
    expect(screen.queryByTestId('remove-member-m1')).not.toBeInTheDocument()
  })

  it('admin cannot see remove button for other admins', () => {
    const members = [ownerMember, adminMember, regularMember]
    render(<MemberList members={members} currentUserId="u2" currentUserRole="admin" onRemove={vi.fn()} />)
    expect(screen.queryByTestId('remove-member-m1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('remove-member-m2')).not.toBeInTheDocument()
    expect(screen.getByTestId('remove-member-m3')).toBeInTheDocument()
  })

  it('does not show remove button for own user', () => {
    render(<MemberList members={allMembers} currentUserId="u3" currentUserRole="member" onRemove={vi.fn()} />)
    expect(screen.queryByTestId('remove-member-m1')).not.toBeInTheDocument()
    expect(screen.queryByTestId('remove-member-m2')).not.toBeInTheDocument()
    expect(screen.queryByTestId('remove-member-m3')).not.toBeInTheDocument()
  })

  it('calls remove handler with correct member on click', async () => {
    const user = userEvent.setup()
    const onRemove = vi.fn()
    render(<MemberList members={allMembers} currentUserId="u1" currentUserRole="owner" onRemove={onRemove} />)
    await user.click(screen.getByTestId('remove-member-m3'))
    expect(onRemove).toHaveBeenCalledWith(regularMember)
  })
})
