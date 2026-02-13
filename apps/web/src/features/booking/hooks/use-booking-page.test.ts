import { renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useBookingPage } from './use-booking-page'

const mockPageData = {
  organizationName: 'Test Org',
  slug: 'test-org',
  services: [
    { id: 'srv-1', name: 'Haircut', description: 'A nice haircut', durationMinutes: 30, price: '50.00' },
    { id: 'srv-2', name: 'Shave', description: null, durationMinutes: 15, price: null },
  ],
}

describe('useBookingPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useBookingPage('test-org'))
    expect(result.current.state).toBe('loading')
    expect(result.current.data).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('fetches booking page data successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockPageData }),
    })
    const { result } = renderHook(() => useBookingPage('test-org'))
    await waitFor(() => expect(result.current.state).toBe('success'))
    expect(result.current.data).toEqual(mockPageData)
    expect(result.current.error).toBeNull()
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org')
  })

  it('sets not-found state when API returns 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })
    const { result } = renderHook(() => useBookingPage('unknown-slug'))
    await waitFor(() => expect(result.current.state).toBe('not-found'))
    expect(result.current.data).toBeNull()
  })

  it('sets error state when API returns non-ok response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })
    const { result } = renderHook(() => useBookingPage('test-org'))
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.error).toBe('Failed to fetch booking page')
    expect(result.current.data).toBeNull()
  })

  it('sets error state on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useBookingPage('test-org'))
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.error).toBe('Network error')
  })

  it('refetches when slug changes', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockPageData }),
    })
    const { result, rerender } = renderHook(({ slug }) => useBookingPage(slug), {
      initialProps: { slug: 'org-a' },
    })
    await waitFor(() => expect(result.current.state).toBe('success'))
    rerender({ slug: 'org-b' })
    await waitFor(() => expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/org-b'))
  })
})
