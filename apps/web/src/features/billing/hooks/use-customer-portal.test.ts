import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useCustomerPortal } from './use-customer-portal'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const originalLocation = window.location

describe('useCustomerPortal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    Object.defineProperty(window, 'location', {
      value: { ...originalLocation, origin: 'http://localhost:5173', href: '' },
      writable: true,
    })
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useCustomerPortal())
    expect(result.current.state).toBe('idle')
    expect(result.current.error).toBeNull()
  })

  it('sets loading state when opening portal', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () => Promise.resolve({ data: { url: 'https://billing.stripe.com/portal' } }),
              }),
            100,
          ),
        ),
    )
    const { result } = renderHook(() => useCustomerPortal())
    act(() => {
      result.current.openPortal()
    })
    expect(result.current.state).toBe('loading')
  })

  it('calls portal API with correct parameters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { url: 'https://billing.stripe.com/portal' } }),
    })
    const { result } = renderHook(() => useCustomerPortal())
    await act(async () => {
      await result.current.openPortal()
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/billing/portal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ returnUrl: 'http://localhost:5173/subscription' }),
    })
  })

  it('redirects to portal URL on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { url: 'https://billing.stripe.com/portal123' } }),
    })
    const { result } = renderHook(() => useCustomerPortal())
    await act(async () => {
      await result.current.openPortal()
    })
    expect(window.location.href).toBe('https://billing.stripe.com/portal123')
  })

  it('sets error state on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Portal creation failed' } }),
    })
    const { result } = renderHook(() => useCustomerPortal())
    await act(async () => {
      await result.current.openPortal()
    })
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Portal creation failed')
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCustomerPortal())
    await act(async () => {
      await result.current.openPortal()
    })
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })
})
