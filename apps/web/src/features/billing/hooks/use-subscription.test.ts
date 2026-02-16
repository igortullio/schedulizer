import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSubscription } from './use-subscription'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useSubscription())
    expect(result.current.state).toBe('loading')
    expect(result.current.subscription).toBeNull()
  })

  it('fetches subscription on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'sub-1', status: 'active' } }),
    })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/billing/subscription', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('sets subscription data on success', async () => {
    const mockSubscription = {
      id: 'sub-1',
      status: 'active',
      plan: 'professional',
      usage: {
        members: { current: 2, limit: 5, canAdd: true },
        services: { current: 3, limit: null, canAdd: true },
      },
      limits: {
        maxMembers: 5,
        maxServices: null,
        notifications: { email: true, whatsapp: true },
      },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSubscription }),
    })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.subscription).toEqual(mockSubscription)
  })

  it('handles null subscription', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: null }),
    })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.subscription).toBeNull()
  })

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to fetch subscription')
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('refetches when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'sub-1', status: 'active' } }),
    })
    const { result } = renderHook(() => useSubscription())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledTimes(1)
    await act(async () => {
      await result.current.refetch()
    })
    expect(mockFetch).toHaveBeenCalledTimes(2)
  })
})
