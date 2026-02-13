import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

export interface AppointmentDetails {
  id: string
  serviceId: string
  serviceName: string
  startDatetime: string
  endDatetime: string
  status: string
  customerName: string
}

type ManageState = 'loading' | 'success' | 'error' | 'not-found'

interface UseManageAppointmentReturn {
  appointment: AppointmentDetails | null
  state: ManageState
  error: string | null
  cancelAppointment: () => Promise<boolean>
  rescheduleAppointment: (startTime: string) => Promise<boolean>
  refetch: () => Promise<void>
}

export function useManageAppointment(slug: string, token: string): UseManageAppointmentReturn {
  const [appointment, setAppointment] = useState<AppointmentDetails | null>(null)
  const [state, setState] = useState<ManageState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchAppointment = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}/manage/${token}`)
      if (response.status === 404) {
        setState('not-found')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch appointment')
      }
      const result: { data: AppointmentDetails } = await response.json()
      setAppointment(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch appointment', {
        slug,
        token,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch appointment')
      setState('error')
    }
  }, [slug, token])
  useEffect(() => {
    fetchAppointment()
  }, [fetchAppointment])
  const cancelAppointment = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}/manage/${token}/cancel`, {
        method: 'POST',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to cancel appointment')
      }
      await fetchAppointment()
      return true
    } catch (err) {
      console.error('Failed to cancel appointment', {
        slug,
        token,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to cancel appointment')
      return false
    }
  }, [slug, token, fetchAppointment])
  const rescheduleAppointment = useCallback(
    async (startTime: string): Promise<boolean> => {
      try {
        const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}/manage/${token}/reschedule`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ startTime }),
        })
        if (response.status === 409) {
          setError('Slot no longer available')
          return false
        }
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message ?? 'Failed to reschedule appointment')
        }
        await fetchAppointment()
        return true
      } catch (err) {
        console.error('Failed to reschedule appointment', {
          slug,
          token,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        setError(err instanceof Error ? err.message : 'Failed to reschedule appointment')
        return false
      }
    },
    [slug, token, fetchAppointment],
  )
  return { appointment, state, error, cancelAppointment, rescheduleAppointment, refetch: fetchAppointment }
}
