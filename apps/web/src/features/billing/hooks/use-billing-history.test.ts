import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useBillingHistory } from './use-billing-history'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useBillingHistory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useBillingHistory())
    expect(result.current.state).toBe('loading')
    expect(result.current.invoices).toEqual([])
  })

  it('fetches invoices on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useBillingHistory())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/billing/invoices', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('sets invoices data on success', async () => {
    const mockInvoices = [
      { id: 'inv-1', status: 'paid', amountPaid: 4990 },
      { id: 'inv-2', status: 'open', amountDue: 9990 },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockInvoices }),
    })
    const { result } = renderHook(() => useBillingHistory())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.invoices).toEqual(mockInvoices)
  })

  it('handles empty invoices', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useBillingHistory())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.invoices).toEqual([])
  })

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
    })
    const { result } = renderHook(() => useBillingHistory())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to fetch invoices')
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useBillingHistory())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('refetches when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useBillingHistory())
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
