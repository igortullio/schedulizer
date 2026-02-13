import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useServices } from './use-services'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockService = {
  id: 'service-1',
  organizationId: 'org-1',
  name: 'Haircut',
  description: 'A nice haircut',
  durationMinutes: 30,
  price: '50.00',
  active: true,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
}

describe('useServices', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useServices())
    expect(result.current.state).toBe('loading')
    expect(result.current.services).toEqual([])
  })

  it('fetches services on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockService] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/services', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('sets services data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockService] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.services).toEqual([mockService])
  })

  it('handles empty services list', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.services).toEqual([])
  })

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to fetch services')
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('creates a service via POST', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockService }),
    })
    let createdService: unknown
    await act(async () => {
      createdService = await result.current.createService({
        name: 'Haircut',
        duration: 30,
        price: '50.00',
      })
    })
    expect(createdService).toEqual(mockService)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/services', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Haircut', duration: 30, price: '50.00' }),
    })
  })

  it('updates a service via PUT', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockService] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const updatedService = { ...mockService, name: 'Premium Haircut' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedService }),
    })
    await act(async () => {
      await result.current.updateService('service-1', { name: 'Premium Haircut' })
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/services/service-1', {
      method: 'PUT',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Premium Haircut' }),
    })
  })

  it('deletes a service via DELETE', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockService] }),
    })
    const { result } = renderHook(() => useServices())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({ ok: true })
    await act(async () => {
      await result.current.deleteService('service-1')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/services/service-1', {
      method: 'DELETE',
      credentials: 'include',
    })
    expect(result.current.services).toEqual([])
  })

  it('refetches when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [mockService] }),
    })
    const { result } = renderHook(() => useServices())
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
