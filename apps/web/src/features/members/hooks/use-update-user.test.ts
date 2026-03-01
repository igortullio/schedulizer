import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useUpdateUser } from './use-update-user'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
globalThis.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

describe('useUpdateUser', () => {
  it('starts in idle state with null result and error', () => {
    const { result } = renderHook(() => useUpdateUser())
    expect(result.current.state).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('updates user successfully and transitions to success state', async () => {
    const updatedUser = { id: 'u1', phoneNumber: '+1234567890', email: 'new@test.com' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUser }),
    })
    const { result } = renderHook(() => useUpdateUser())
    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.updateUser('u1', { email: 'new@test.com' })
    })
    expect(result.current.state).toBe('success')
    expect(result.current.result).toEqual(updatedUser)
    expect(returnValue).toEqual(updatedUser)
    expect(result.current.error).toBeNull()
  })

  it('returns updated user data on success', async () => {
    const updatedUser = { id: 'u1', phoneNumber: '+1234567890', email: 'updated@test.com' }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: updatedUser }),
    })
    const { result } = renderHook(() => useUpdateUser())
    let returnValue: unknown
    await act(async () => {
      returnValue = await result.current.updateUser('u1', { phoneNumber: '+1234567890' })
    })
    expect(returnValue).toEqual(updatedUser)
  })

  it('handles 400 validation error and sets error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Validation error', code: 'INVALID_REQUEST' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u1', { email: 'invalid' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Validation error')
    expect(result.current.result).toBeNull()
  })

  it('handles 403 forbidden error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Forbidden', code: 'FORBIDDEN' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u2', { email: 'test@test.com' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Forbidden')
  })

  it('handles 404 user not found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'User not found', code: 'NOT_FOUND' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('unknown', { email: 'test@test.com' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('User not found')
  })

  it('handles 409 duplicate email error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Email already in use', code: 'DUPLICATE_EMAIL' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u1', { email: 'taken@test.com' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Email already in use')
  })

  it('handles 409 duplicate phone error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Phone number already in use', code: 'DUPLICATE_PHONE' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u1', { phoneNumber: '+1111111111' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Phone number already in use')
  })

  it('handles network failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u1', { email: 'test@test.com' })
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error')
  })

  it('sends correct request body, headers, and method', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'u1', phoneNumber: '+1234567890', email: 'test@test.com' } }),
    })
    const { result } = renderHook(() => useUpdateUser())
    await act(async () => {
      await result.current.updateUser('u1', { email: 'test@test.com', phoneNumber: '+1234567890' })
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/users/u1', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@test.com', phoneNumber: '+1234567890' }),
    })
  })
})
