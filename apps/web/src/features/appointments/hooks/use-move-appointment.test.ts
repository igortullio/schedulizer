import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useMoveAppointment } from './use-move-appointment'

const mockMoveData = {
  appointmentId: 'apt-1',
  startDatetime: '2025-06-15T14:00:00.000Z',
  endDatetime: '2025-06-15T14:30:00.000Z',
}

const mockResult = {
  id: 'apt-1',
  organizationId: 'org-1',
  serviceId: 'srv-1',
  startDatetime: '2025-06-15T14:00:00.000Z',
  endDatetime: '2025-06-15T14:30:00.000Z',
  status: 'confirmed',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  notes: null,
  createdAt: '2025-06-10T10:00:00.000Z',
  updatedAt: '2025-06-15T14:00:00.000Z',
  serviceName: 'Haircut',
}

describe('useMoveAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state with no errors or conflicts', () => {
    const { result } = renderHook(() => useMoveAppointment())
    expect(result.current.state).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.conflictingAppointments).toEqual([])
  })

  it('moves appointment successfully and transitions to success state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockResult }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('success')
    expect(moved).toEqual(mockResult)
  })

  it('handles 409 conflict response and stores conflicting appointments', async () => {
    const conflicting = [
      {
        id: 'apt-2',
        customerName: 'Jane Doe',
        startDatetime: '2025-06-15T14:00:00.000Z',
        endDatetime: '2025-06-15T14:30:00.000Z',
      },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
      json: () => Promise.resolve({ error: 'Time conflict', data: { conflictingAppointments: conflicting } }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('conflict')
    expect(result.current.conflictingAppointments).toEqual(conflicting)
    expect(moved).toBeNull()
  })

  it('force retry with force: true bypasses conflict and succeeds', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockResult }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment({ ...mockMoveData, force: true })
    })
    expect(result.current.state).toBe('success')
    expect(moved).toEqual(mockResult)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDatetime: mockMoveData.startDatetime,
        endDatetime: mockMoveData.endDatetime,
        force: true,
      }),
    })
  })

  it('handles network error and sets error state', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error')
    expect(moved).toBeNull()
  })

  it('handles 404 appointment not found error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ error: 'Appointment not found' }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Appointment not found')
    expect(moved).toBeNull()
  })

  it('handles 401 unauthorized error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    let moved: unknown
    await act(async () => {
      moved = await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Unauthorized')
    expect(moved).toBeNull()
  })

  it('resets state correctly', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Some error'))
    const { result } = renderHook(() => useMoveAppointment())
    await act(async () => {
      await result.current.moveAppointment(mockMoveData)
    })
    expect(result.current.state).toBe('error')
    act(() => {
      result.current.resetState()
    })
    expect(result.current.state).toBe('idle')
    expect(result.current.error).toBeNull()
    expect(result.current.conflictingAppointments).toEqual([])
  })

  it('sends correct PATCH request with proper URL and body', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockResult }),
    })
    const { result } = renderHook(() => useMoveAppointment())
    await act(async () => {
      await result.current.moveAppointment(mockMoveData)
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1', {
      method: 'PATCH',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        startDatetime: mockMoveData.startDatetime,
        endDatetime: mockMoveData.endDatetime,
        force: undefined,
      }),
    })
  })
})
