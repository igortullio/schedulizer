import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useSlots } from './use-slots'

const mockSlots = [
  { startTime: '2025-01-15T09:00:00Z', endTime: '2025-01-15T09:30:00Z' },
  { startTime: '2025-01-15T09:30:00Z', endTime: '2025-01-15T10:00:00Z' },
  { startTime: '2025-01-15T10:00:00Z', endTime: '2025-01-15T10:30:00Z' },
]

describe('useSlots', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state with empty slots', () => {
    const { result } = renderHook(() => useSlots())
    expect(result.current.state).toBe('idle')
    expect(result.current.slots).toEqual([])
    expect(result.current.error).toBeNull()
  })

  it('fetches slots successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { slots: mockSlots } }),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-15')
    })
    expect(result.current.state).toBe('success')
    expect(result.current.slots).toEqual(mockSlots)
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/booking/test-org/services/srv-1/slots?date=2025-01-15',
    )
  })

  it('sets error state when API returns error with JSON body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Service not found' } }),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'invalid', '2025-01-15')
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('slots.errors.fetchFailed')
    expect(result.current.slots).toEqual([])
  })

  it('maps known API error to i18n key', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Date cannot be in the past' } }),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-01')
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('slots.errors.pastDate')
  })

  it('handles non-JSON error response gracefully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.reject(new Error('Invalid JSON')),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-15')
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('slots.errors.fetchFailed')
  })

  it('sets error state on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-15')
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error')
  })

  it('clears previous slots when fetching new date', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { slots: mockSlots } }),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-15')
    })
    expect(result.current.slots).toHaveLength(3)
    mockFetch.mockImplementation(() => new Promise(() => {}))
    act(() => {
      result.current.fetchSlots('test-org', 'srv-1', '2025-01-16')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('loading')
      expect(result.current.slots).toEqual([])
    })
  })

  it('returns empty slots array when no slots available', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { slots: [] } }),
    })
    const { result } = renderHook(() => useSlots())
    await act(async () => {
      await result.current.fetchSlots('test-org', 'srv-1', '2025-01-15')
    })
    expect(result.current.state).toBe('success')
    expect(result.current.slots).toEqual([])
  })
})
