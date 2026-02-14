import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useOrganizationSettings } from './use-organization-settings'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockSettings = {
  slug: 'my-business',
  timezone: 'America/Sao_Paulo',
}

describe('useOrganizationSettings', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useOrganizationSettings())
    expect(result.current.state).toBe('loading')
    expect(result.current.settings).toBeNull()
  })

  it('fetches settings on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSettings }),
    })
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/organizations/settings', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('sets settings data on success', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSettings }),
    })
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.settings).toEqual(mockSettings)
  })

  it('sets error state on fetch failure', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to fetch organization settings')
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('updates settings via PATCH', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSettings }),
    })
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    const updatedSettings = { slug: 'new-slug', timezone: 'UTC' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedSettings }),
    })
    let updatedResult: unknown
    await act(async () => {
      updatedResult = await result.current.updateSettings({ slug: 'new-slug', timezone: 'UTC' })
    })
    expect(updatedResult).toEqual(updatedSettings)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/organizations/settings', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug: 'new-slug', timezone: 'UTC' }),
    })
    expect(result.current.settings).toEqual(updatedSettings)
  })

  it('throws error on failed update', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: mockSettings }),
    })
    const { result } = renderHook(() => useOrganizationSettings())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Slug already in use' } }),
    })
    await expect(
      act(async () => {
        await result.current.updateSettings({ slug: 'taken-slug' })
      }),
    ).rejects.toThrow('Slug already in use')
  })

  it('refetches when refetch is called', async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: mockSettings }),
    })
    const { result } = renderHook(() => useOrganizationSettings())
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
