import { act, renderHook } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
}))

const mockFetch = vi.fn()
global.fetch = mockFetch

import { useCreateAppointment } from './use-create-appointment'

const mockAppointmentData = {
  serviceId: 'srv-1',
  startTime: '2025-01-15T09:00:00Z',
  customerName: 'John Doe',
  customerEmail: 'john@example.com',
  customerPhone: '11999999999',
}

const mockAppointmentResult = {
  id: 'apt-1',
  startDatetime: '2025-01-15T09:00:00Z',
  endDatetime: '2025-01-15T09:30:00Z',
  status: 'pending',
  managementToken: 'mgmt-token-123',
}

describe('useCreateAppointment', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('starts in idle state', () => {
    const { result } = renderHook(() => useCreateAppointment())
    expect(result.current.state).toBe('idle')
    expect(result.current.result).toBeNull()
    expect(result.current.error).toBeNull()
  })

  it('creates appointment successfully', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockAppointmentResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.state).toBe('success')
    expect(result.current.result).toEqual(mockAppointmentResult)
    expect(created).toEqual(mockAppointmentResult)
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pt-BR' },
      body: JSON.stringify(mockAppointmentData),
    })
  })

  it('handles 409 conflict for unavailable slot', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 409,
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.state).toBe('conflict')
    expect(result.current.error).toBe('Slot no longer available')
    expect(created).toBeNull()
  })

  it('handles API error response', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ error: { message: 'Validation failed' } }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Validation failed')
    expect(created).toBeNull()
  })

  it('handles network failure', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'))
    const { result } = renderHook(() => useCreateAppointment())
    let created: unknown
    await act(async () => {
      created = await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.state).toBe('error')
    expect(result.current.error).toBe('Network error')
    expect(created).toBeNull()
  })

  it('sends Accept-Language: pt-BR header when locale is pt-BR', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockAppointmentResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment('test-org', mockAppointmentData, 'pt-BR')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pt-BR' },
      body: JSON.stringify(mockAppointmentData),
    })
  })

  it('sends Accept-Language: en header when locale is en', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockAppointmentResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment('test-org', mockAppointmentData, 'en')
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'en' },
      body: JSON.stringify(mockAppointmentData),
    })
  })

  it('defaults Accept-Language to pt-BR when no locale is provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockAppointmentResult }),
    })
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(mockFetch).toHaveBeenCalledWith('http://localhost:3000/api/booking/test-org/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Accept-Language': 'pt-BR' },
      body: JSON.stringify(mockAppointmentData),
    })
  })

  it('resets error when creating new appointment', async () => {
    mockFetch.mockRejectedValueOnce(new Error('First error'))
    const { result } = renderHook(() => useCreateAppointment())
    await act(async () => {
      await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.error).toBe('First error')
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 201,
      json: () => Promise.resolve({ data: mockAppointmentResult }),
    })
    await act(async () => {
      await result.current.createAppointment('test-org', mockAppointmentData)
    })
    expect(result.current.error).toBeNull()
    expect(result.current.state).toBe('success')
  })
})
