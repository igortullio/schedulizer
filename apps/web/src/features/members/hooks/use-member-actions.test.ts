import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockInviteMember = vi.fn()
const mockRemoveMember = vi.fn()
const mockCancelInvitation = vi.fn()

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      inviteMember: (...args: unknown[]) => mockInviteMember(...args),
      removeMember: (...args: unknown[]) => mockRemoveMember(...args),
      cancelInvitation: (...args: unknown[]) => mockCancelInvitation(...args),
    },
  },
}))

import { useMemberActions } from './use-member-actions'

const defaultCallbacks = {
  onInviteSuccess: vi.fn(),
  onRemoveSuccess: vi.fn(),
  onCancelSuccess: vi.fn(),
  onResendSuccess: vi.fn(),
}

describe('useMemberActions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('inviteMember calls authClient with correct params', async () => {
    mockInviteMember.mockResolvedValueOnce({ data: { id: 'inv1' }, error: null })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await act(async () => {
      await result.current.inviteMember({ email: 'test@test.com', role: 'member', organizationId: 'org1' })
    })
    expect(mockInviteMember).toHaveBeenCalledWith({
      email: 'test@test.com',
      role: 'member',
      organizationId: 'org1',
    })
    expect(defaultCallbacks.onInviteSuccess).toHaveBeenCalled()
  })

  it('removeMember calls authClient with correct params', async () => {
    mockRemoveMember.mockResolvedValueOnce({ data: null, error: null })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await act(async () => {
      await result.current.removeMember('user-123')
    })
    expect(mockRemoveMember).toHaveBeenCalledWith({ memberIdOrEmail: 'user-123' })
    expect(defaultCallbacks.onRemoveSuccess).toHaveBeenCalled()
  })

  it('cancelInvitation calls authClient with correct params', async () => {
    mockCancelInvitation.mockResolvedValueOnce({ data: null, error: null })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await act(async () => {
      await result.current.cancelInvitation('inv-1')
    })
    expect(mockCancelInvitation).toHaveBeenCalledWith({ invitationId: 'inv-1' })
    expect(defaultCallbacks.onCancelSuccess).toHaveBeenCalled()
  })

  it('resendInvitation cancels then re-invites', async () => {
    mockCancelInvitation.mockResolvedValueOnce({ data: null, error: null })
    mockInviteMember.mockResolvedValueOnce({ data: { id: 'inv2' }, error: null })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await act(async () => {
      await result.current.resendInvitation({
        invitationId: 'inv-1',
        email: 'test@test.com',
        role: 'member',
        organizationId: 'org1',
      })
    })
    expect(mockCancelInvitation).toHaveBeenCalledWith({ invitationId: 'inv-1' })
    expect(mockInviteMember).toHaveBeenCalledWith({
      email: 'test@test.com',
      role: 'member',
      organizationId: 'org1',
    })
    expect(defaultCallbacks.onResendSuccess).toHaveBeenCalled()
    expect(defaultCallbacks.onCancelSuccess).not.toHaveBeenCalled()
  })

  it('resendInvitation handles partial failure when cancel succeeds but invite fails', async () => {
    mockCancelInvitation.mockResolvedValueOnce({ data: null, error: null })
    mockInviteMember.mockResolvedValueOnce({ data: null, error: { message: 'Failed to invite' } })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await expect(
      act(async () => {
        await result.current.resendInvitation({
          invitationId: 'inv-1',
          email: 'test@test.com',
          role: 'member',
          organizationId: 'org1',
        })
      }),
    ).rejects.toThrow('Failed to invite')
    expect(defaultCallbacks.onResendSuccess).not.toHaveBeenCalled()
  })

  it('inviteMember throws on API error', async () => {
    mockInviteMember.mockResolvedValueOnce({ data: null, error: { message: 'Already invited' } })
    const { result } = renderHook(() => useMemberActions(defaultCallbacks))
    await expect(
      act(async () => {
        await result.current.inviteMember({ email: 'test@test.com', role: 'member', organizationId: 'org1' })
      }),
    ).rejects.toThrow('Already invited')
    expect(defaultCallbacks.onInviteSuccess).not.toHaveBeenCalled()
  })
})
