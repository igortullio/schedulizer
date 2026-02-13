import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAppointments } from './use-appointments'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

const mockAppointment = {
  id: 'apt-1',
  organizationId: 'org-1',
  serviceId: 'service-1',
  startDatetime: '2025-06-15T14:00:00.000Z',
  endDatetime: '2025-06-15T14:30:00.000Z',
  status: 'pending' as const,
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
  notes: null,
  createdAt: '2025-06-10T10:00:00.000Z',
  updatedAt: '2025-06-10T10:00:00.000Z',
  serviceName: 'Haircut',
}

describe('useAppointments', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in loading state and fetches on mount', () => {
    mockFetch.mockImplementation(() => new Promise(() => {}))
    const { result } = renderHook(() => useAppointments())
    expect(result.current.state).toBe('loading')
    expect(result.current.appointments).toEqual([])
  })

  it('sets data on successful fetch', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    expect(result.current.appointments).toEqual([mockAppointment])
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments', {
      method: 'GET',
      credentials: 'include',
    })
  })

  it('handles fetch errors with error state', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Failed to fetch appointments')
  })

  it('handles network errors', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('error')
    })
    expect(result.current.error).toBe('Network error')
  })

  it('supports filtering by status', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    })
    act(() => {
      result.current.setFilters({ status: 'pending' })
    })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments?status=pending', {
        method: 'GET',
        credentials: 'include',
      })
    })
  })

  it('supports filtering by date range', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    })
    act(() => {
      result.current.setFilters({ from: '2025-06-01', to: '2025-06-30' })
    })
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments?from=2025-06-01&to=2025-06-30', {
        method: 'GET',
        credentials: 'include',
      })
    })
  })

  it('confirmAppointment calls correct endpoint and updates local state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'apt-1', status: 'confirmed' } }),
    })
    await act(async () => {
      await result.current.confirmAppointment('apt-1')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1/confirm', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.appointments[0].status).toBe('confirmed')
  })

  it('completeAppointment calls correct endpoint and updates local state', async () => {
    const confirmedAppointment = { ...mockAppointment, status: 'confirmed' as const }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [confirmedAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'apt-1', status: 'completed' } }),
    })
    await act(async () => {
      await result.current.completeAppointment('apt-1')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1/complete', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.appointments[0].status).toBe('completed')
  })

  it('markNoShow calls correct endpoint and updates local state', async () => {
    const confirmedAppointment = { ...mockAppointment, status: 'confirmed' as const }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [confirmedAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'apt-1', status: 'no_show' } }),
    })
    await act(async () => {
      await result.current.markNoShow('apt-1')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1/no-show', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.appointments[0].status).toBe('no_show')
  })

  it('cancelAppointment calls correct endpoint and updates local state', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: { id: 'apt-1', status: 'cancelled' } }),
    })
    await act(async () => {
      await result.current.cancelAppointment('apt-1')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/appointments/apt-1/cancel', {
      method: 'POST',
      credentials: 'include',
    })
    expect(result.current.appointments[0].status).toBe('cancelled')
  })

  it('transition functions throw on API error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: [mockAppointment] }),
    })
    const { result } = renderHook(() => useAppointments())
    await waitFor(() => {
      expect(result.current.state).toBe('success')
    })
    mockFetch.mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ error: { message: 'Invalid status transition' } }),
    })
    await expect(
      act(async () => {
        await result.current.confirmAppointment('apt-1')
      }),
    ).rejects.toThrow('Invalid status transition')
  })
})
