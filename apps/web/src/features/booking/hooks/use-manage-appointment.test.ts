import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useManageAppointment } from './use-manage-appointment'

const mockAppointment = {
  id: 'apt-1',
  serviceId: 'srv-1',
  serviceName: 'Haircut',
  startDatetime: '2025-01-15T09:00:00Z',
  endDatetime: '2025-01-15T09:30:00Z',
  status: 'pending',
  customerName: 'John Doe',
}

describe('useManageAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('fetches appointment details on mount', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: () => Promise.resolve({ data: mockAppointment }),
    })
    const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
    await waitFor(() => expect(result.current.state).toBe('success'))
    expect(result.current.appointment).toEqual(mockAppointment)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/manage/token-123')
  })

  it('sets not-found state when token is invalid', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
    })
    const { result } = renderHook(() => useManageAppointment('test-org', 'invalid-token'))
    await waitFor(() => expect(result.current.state).toBe('not-found'))
    expect(result.current.appointment).toBeNull()
  })

  it('sets error state on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
    })
    const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.error).toBe('Failed to fetch appointment')
  })

  it('sets error state on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
    await waitFor(() => expect(result.current.state).toBe('error'))
    expect(result.current.error).toBe('Network error')
  })

  describe('cancelAppointment', () => {
    it('cancels appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockAppointment }),
      })
      const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
      await waitFor(() => expect(result.current.state).toBe('success'))
      mockFetch.mockResolvedValueOnce({ ok: true })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: { ...mockAppointment, status: 'cancelled' } }),
      })
      let success: boolean | undefined
      await act(async () => {
        success = await result.current.cancelAppointment()
      })
      expect(success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/manage/token-123/cancel', {
        method: 'POST',
      })
    })

    it('returns false when cancel fails', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockAppointment }),
      })
      const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
      await waitFor(() => expect(result.current.state).toBe('success'))
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: () => Promise.resolve({ error: { message: 'Cannot cancel' } }),
      })
      let success: boolean | undefined
      await act(async () => {
        success = await result.current.cancelAppointment()
      })
      expect(success).toBe(false)
      expect(result.current.error).toBe('Cannot cancel')
    })
  })

  describe('rescheduleAppointment', () => {
    it('reschedules appointment successfully', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockAppointment }),
      })
      const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
      await waitFor(() => expect(result.current.state).toBe('success'))
      mockFetch.mockResolvedValueOnce({ ok: true })
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () =>
          Promise.resolve({
            data: { ...mockAppointment, startDatetime: '2025-01-16T10:00:00Z' },
          }),
      })
      let success: boolean | undefined
      await act(async () => {
        success = await result.current.rescheduleAppointment('2025-01-16T10:00:00Z')
      })
      expect(success).toBe(true)
      expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/manage/token-123/reschedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: '2025-01-16T10:00:00Z' }),
      })
    })

    it('handles 409 conflict for slot no longer available', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockAppointment }),
      })
      const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
      await waitFor(() => expect(result.current.state).toBe('success'))
      mockFetch.mockResolvedValueOnce({ ok: false, status: 409 })
      let success: boolean | undefined
      await act(async () => {
        success = await result.current.rescheduleAppointment('2025-01-16T10:00:00Z')
      })
      expect(success).toBe(false)
      expect(result.current.error).toBe('Slot no longer available')
    })

    it('returns false on reschedule failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve({ data: mockAppointment }),
      })
      const { result } = renderHook(() => useManageAppointment('test-org', 'token-123'))
      await waitFor(() => expect(result.current.state).toBe('success'))
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      let success: boolean | undefined
      await act(async () => {
        success = await result.current.rescheduleAppointment('2025-01-16T10:00:00Z')
      })
      expect(success).toBe(false)
      expect(result.current.error).toBe('Network error')
    })
  })
})
