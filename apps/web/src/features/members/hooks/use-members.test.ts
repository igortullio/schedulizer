import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListMembers = vi.fn()
const mockListInvitations = vi.fn()

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      listMembers: (...args: unknown[]) => mockListMembers(...args),
      listInvitations: (...args: unknown[]) => mockListInvitations(...args),
    },
  },
}))

import { useMembers } from './use-members'

const mockMembers = [
  {
    id: 'm1',
    userId: 'u1',
    organizationId: 'org1',
    role: 'owner',
    createdAt: new Date('2025-01-01'),
    user: { id: 'u1', name: 'Alice', email: 'alice@test.com', image: null },
  },
  {
    id: 'm2',
    userId: 'u2',
    organizationId: 'org1',
    role: 'member',
    createdAt: new Date('2025-01-02'),
    user: { id: 'u2', name: 'Bob', email: 'bob@test.com', image: null },
  },
]

const mockInvitations = [
  {
    id: 'inv1',
    email: 'charlie@test.com',
    role: 'member',
    status: 'pending',
    expiresAt: new Date('2025-12-31'),
    organizationId: 'org1',
    inviterId: 'u1',
  },
]

describe('useMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockListMembers.mockImplementation(() => new Promise(() => {}))
    mockListInvitations.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useMembers())
    expect(result.current.membersState).toBe('loading')
    expect(result.current.invitationsState).toBe('loading')
    expect(result.current.members).toEqual([])
    expect(result.current.invitations).toEqual([])
  })

  it('fetches and returns members list', async () => {
    mockListMembers.mockResolvedValueOnce({ data: { members: mockMembers, total: 2 }, error: null })
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('success')
    })
    expect(result.current.members).toEqual(mockMembers)
  })

  it('fetches and returns invitations list', async () => {
    mockListMembers.mockResolvedValueOnce({ data: { members: mockMembers, total: 2 }, error: null })
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.invitationsState).toBe('success')
    })
    expect(result.current.invitations).toEqual(mockInvitations)
  })

  it('handles error state when members fetch fails', async () => {
    mockListMembers.mockRejectedValueOnce(new Error('Network error'))
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('error')
    })
    expect(result.current.membersError).toBe('Network error')
  })

  it('handles error state when invitations fetch fails', async () => {
    mockListMembers.mockResolvedValueOnce({ data: { members: mockMembers, total: 2 }, error: null })
    mockListInvitations.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.invitationsState).toBe('error')
    })
    expect(result.current.invitationsError).toBe('Network error')
  })

  it('handles API error response for members', async () => {
    mockListMembers.mockResolvedValueOnce({ data: null, error: { message: 'Forbidden' } })
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('error')
    })
    expect(result.current.membersError).toBe('Forbidden')
  })

  it('refetch functions trigger new data fetch', async () => {
    mockListMembers.mockResolvedValue({ data: { members: mockMembers, total: 2 }, error: null })
    mockListInvitations.mockResolvedValue({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('success')
    })
    expect(mockListMembers).toHaveBeenCalledTimes(1)
    await act(async () => {
      await result.current.refetchMembers()
    })
    expect(mockListMembers).toHaveBeenCalledTimes(2)
    await act(async () => {
      await result.current.refetchInvitations()
    })
    expect(mockListInvitations).toHaveBeenCalledTimes(2)
  })
})
