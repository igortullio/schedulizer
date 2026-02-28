import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockListInvitations = vi.fn()
const mockFetch = vi.fn()

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      listInvitations: (...args: unknown[]) => mockListInvitations(...args),
    },
  },
}))

vi.stubGlobal('fetch', mockFetch)

import { useMembers } from './use-members'

const mockMembers = [
  {
    id: 'm1',
    userId: 'u1',
    organizationId: 'org1',
    role: 'owner',
    createdAt: new Date('2025-01-01'),
    user: { id: 'u1', name: 'Alice', email: 'alice@test.com', phoneNumber: null, image: null },
  },
  {
    id: 'm2',
    userId: 'u2',
    organizationId: 'org1',
    role: 'member',
    createdAt: new Date('2025-01-02'),
    user: { id: 'u2', name: 'Bob', email: null, phoneNumber: '+5511999999999', image: null },
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

function mockFetchSuccess(data: unknown) {
  mockFetch.mockResolvedValueOnce({
    ok: true,
    json: async () => ({ data }),
  })
}

function mockFetchError(status = 500) {
  mockFetch.mockResolvedValueOnce({
    ok: false,
    status,
  })
}

describe('useMembers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    mockListInvitations.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useMembers())
    expect(result.current.membersState).toBe('loading')
    expect(result.current.invitationsState).toBe('loading')
    expect(result.current.members).toEqual([])
    expect(result.current.invitations).toEqual([])
  })

  it('fetches and returns members list', async () => {
    mockFetchSuccess(mockMembers)
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('success')
    })
    expect(result.current.members).toEqual(mockMembers)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/members', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('fetches and returns invitations list', async () => {
    mockFetchSuccess(mockMembers)
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.invitationsState).toBe('success')
    })
    expect(result.current.invitations).toEqual(mockInvitations)
  })

  it('handles error state when members fetch fails', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('error')
    })
    expect(result.current.membersError).toBe('Network error')
  })

  it('handles error state when invitations fetch fails', async () => {
    mockFetchSuccess(mockMembers)
    mockListInvitations.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.invitationsState).toBe('error')
    })
    expect(result.current.invitationsError).toBe('Network error')
  })

  it('handles API error response for members', async () => {
    mockFetchError(403)
    mockListInvitations.mockResolvedValueOnce({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('error')
    })
    expect(result.current.membersError).toBe('Failed to fetch members')
  })

  it('refetch functions trigger new data fetch', async () => {
    mockFetchSuccess(mockMembers)
    mockListInvitations.mockResolvedValue({ data: mockInvitations, error: null })
    const { result } = renderHook(() => useMembers())
    await waitFor(() => {
      expect(result.current.membersState).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    mockFetchSuccess(mockMembers)
    await act(async () => {
      await result.current.refetchMembers()
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
    await act(async () => {
      await result.current.refetchInvitations()
    })
    expect(mockListInvitations).toHaveBeenCalledTimes(2)
  })
})
