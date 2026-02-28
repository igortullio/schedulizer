import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useCreateAppointment } from './use-create-appointment'

const mockData = {
  serviceId: 'srv-1',
  startDatetime: '2025-01-15T09:00:00',
  endDatetime: '2025-01-15T10:00:00',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  status: 'confirmed' as const,
  notes: 'Test notes',
}

const mockResult = {
  id: 'apt-1',
  organizationId: 'org-1',
  serviceId: 'srv-1',
  startDatetime: '2025-01-15T09:00:00',
  endDatetime: '2025-01-15T10:00:00',
  status: 'confirmed',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  notes: 'Test notes',
}

describe('useCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state with null result and error', () => {
    const { result } = renderHook(() => useCreateAppointment())
    expect(result.current.state).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('creates appointment successfully and transitions to success state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment(mockData)
    })
    expect(result.current.state).toBe('success')
    expect(result.current.result).toEqual(mockResult)
    expect(created).toEqual(mockResult)
  })

  it('handles 400 validation error and sets error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: 'Validation error' }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment(mockData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Validation error')
    expect(created).toBeNull()
  })

  it('handles 404 service not found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Service not found' }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment(mockData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Service not found')
    expect(created).toBeNull()
  })

  it('handles 409 time conflict and transitions to conflict state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Time conflict', data: { conflictingAppointments: [] } }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment(mockData)
    })
    expect(result.current.state).toBe('conflict')
    expect(result.current.error).toBe('Time conflict')
    expect(created).toBeNull()
  })

  it('handles network failure gracefully', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment(mockData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error')
    expect(created).toBeNull()
  })

  it('resets error state when creating new appointment', async () => {
    mockFetch.mockRejectedValueOnce(new Error('First error'))
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment(mockData)
    })
    expect(result.current.error).toBe('First error')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockResult }),
    })
    await act(async () => {
      await result.current.createAppointment(mockData)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.state).toBe('success')
  })

  it('sends correct request body and headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment(mockData)
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments', {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mockData),
    })
  })
})
