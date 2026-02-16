import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useValidateDowngrade } from './use-validate-downgrade'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

describe('useValidateDowngrade', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useValidateDowngrade())
    expect(result.current.state).toBe('idle')
    expect(result.current.validation).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('sets loading state when validating', async () => {
    mockFetch.mockImplementation(
      () =>
        new Promise(resolve =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                json: () =>
                  Promise.resolve({
                    data: {
                      canDowngrade: true,
                      currentUsage: { members: 1, services: 3 },
                      targetLimits: { maxMembers: 1, maxServices: 5 },
                    },
                  }),
              }),
            100,
          ),
        ),
    )
    const { result } = renderHook(() => useValidateDowngrade())
    act(() => {
      result.current.validateDowngrade('essential')
    })
    expect(result.current.state).toBe('loading')
  })

  it('calls validate-downgrade API with correct URL', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            canDowngrade: true,
            currentUsage: { members: 1, services: 3 },
            targetLimits: { maxMembers: 1, maxServices: 5 },
          },
        }),
    })
    const { result } = renderHook(() => useValidateDowngrade())
    await act(async () => {
      await result.current.validateDowngrade('essential')
    })
    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/billing/validate-downgrade?targetPlan=essential',
      {
        method: 'GET',
        credentials: 'include',
      },
    )
  })

  it('returns validation data when downgrade is allowed', async () => {
    const validationData = {
      canDowngrade: true,
      currentUsage: { members: 1, services: 3 },
      targetLimits: { maxMembers: 1, maxServices: 5 },
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: validationData }),
    })
    const { result } = renderHook(() => useValidateDowngrade())
    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.validateDowngrade('essential')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.validation).toEqual(validationData)
    expect(returnValue).toEqual(validationData)
  })

  it('returns validation data when downgrade is blocked', async () => {
    const validationData = {
      canDowngrade: false,
      currentUsage: { members: 3, services: 8 },
      targetLimits: { maxMembers: 1, maxServices: 5 },
      exceeded: [
        { resource: 'members', current: 3, limit: 1 },
        { resource: 'services', current: 8, limit: 5 },
      ],
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: validationData }),
    })
    const { result } = renderHook(() => useValidateDowngrade())
    await act(async () => {
      await result.current.validateDowngrade('essential')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.validation?.canDowngrade).toBe(false)
    expect(result.current.validation?.exceeded).toHaveLength(2)
  })

  it('sets error state on API failure', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Validation failed' } }),
    })
    const { result } = renderHook(() => useValidateDowngrade())
    const returnValue = await act(async () => {
      return await result.current.validateDowngrade('essential')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to validate downgrade')
    expect(returnValue).toBeNull()
  })

  it('sets error state on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useValidateDowngrade())
    await act(async () => {
      await result.current.validateDowngrade('essential')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('resets state correctly', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: {
            canDowngrade: true,
            currentUsage: { members: 1, services: 3 },
            targetLimits: { maxMembers: 1, maxServices: 5 },
          },
        }),
    })
    const { result } = renderHook(() => useValidateDowngrade())
    await act(async () => {
      await result.current.validateDowngrade('essential')
    })
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    act(() => {
      result.current.reset()
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.validation).toBeNull()
    expect(result.current.error).toBeNull()
  })
})
