import { clientEnv } from '@schedulizer/env/client'
import type { AppointmentStatus } from '@schedulizer/shared-types'
import { useCallback, useEffect, useState } from 'react'

export interface AppointmentResponse {
  id: string
  organizationId: string
  serviceId: string
  startDatetime: string
  endDatetime: string
  status: AppointmentStatus
  customerName: string
  customerEmail: string
  customerPhone: string
  notes: string | null
  createdAt: string
  updatedAt: string
  serviceName: string
}

type AppointmentState = 'loading' | 'success' | 'error'

interface AppointmentFilters {
  status?: AppointmentStatus
  from?: string
  to?: string
}

interface UseAppointmentsReturn {
  appointments: AppointmentResponse[]
  state: AppointmentState
  error: string | null
  filters: AppointmentFilters
  setFilters: (filters: AppointmentFilters) => void
  refetch: () => Promise<void>
  confirmAppointment: (id: string) => Promise<boolean>
  completeAppointment: (id: string) => Promise<boolean>
  markNoShow: (id: string) => Promise<boolean>
  cancelAppointment: (id: string) => Promise<boolean>
}

async function transitionAppointmentStatus(
  id: string,
  action: string,
): Promise<{ id: string; status: AppointmentStatus } | null> {
  const response = await fetch(`${clientEnv.apiUrl}/api/appointments/${id}/${action}`, {
    method: 'POST',
    credentials: 'include',
  })
  if (!response.ok) {
    const errorData = await response.json()
    throw new Error(errorData.error?.message ?? `Failed to ${action} appointment`)
  }
  const result: { data: { id: string; status: AppointmentStatus } } = await response.json()
  return result.data
}

export function useAppointments(): UseAppointmentsReturn {
  const [appointments, setAppointments] = useState<AppointmentResponse[]>([])
  const [state, setState] = useState<AppointmentState>('loading')
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<AppointmentFilters>({})
  const fetchAppointments = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filters.status) params.set('status', filters.status)
      if (filters.from) params.set('from', filters.from)
      if (filters.to) params.set('to', filters.to)
      const queryString = params.toString()
      const url = `${clientEnv.apiUrl}/api/appointments${queryString ? `?${queryString}` : ''}`
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch appointments')
      }
      const result: { data: AppointmentResponse[] } = await response.json()
      setAppointments(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch appointments', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch appointments')
      setState('error')
    }
  }, [filters])
  useEffect(() => {
    fetchAppointments()
  }, [fetchAppointments])
  const updateLocalStatus = useCallback((id: string, newStatus: AppointmentStatus) => {
    setAppointments(prev => prev.map(a => (a.id === id ? { ...a, status: newStatus } : a)))
  }, [])
  const confirmAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await transitionAppointmentStatus(id, 'confirm')
        if (result) updateLocalStatus(id, result.status)
        return true
      } catch (err) {
        console.error('Failed to confirm appointment', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        throw err
      }
    },
    [updateLocalStatus],
  )
  const completeAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await transitionAppointmentStatus(id, 'complete')
        if (result) updateLocalStatus(id, result.status)
        return true
      } catch (err) {
        console.error('Failed to complete appointment', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        throw err
      }
    },
    [updateLocalStatus],
  )
  const markNoShow = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await transitionAppointmentStatus(id, 'no-show')
        if (result) updateLocalStatus(id, result.status)
        return true
      } catch (err) {
        console.error('Failed to mark appointment as no-show', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        throw err
      }
    },
    [updateLocalStatus],
  )
  const cancelAppointment = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const result = await transitionAppointmentStatus(id, 'cancel')
        if (result) updateLocalStatus(id, result.status)
        return true
      } catch (err) {
        console.error('Failed to cancel appointment', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        throw err
      }
    },
    [updateLocalStatus],
  )
  return {
    appointments,
    state,
    error,
    filters,
    setFilters,
    refetch: fetchAppointments,
    confirmAppointment,
    completeAppointment,
    markNoShow,
    cancelAppointment,
  }
}
