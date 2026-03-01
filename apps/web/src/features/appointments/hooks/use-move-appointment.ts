import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'
import type { AppointmentResponse } from './use-appointments'

interface ConflictingAppointment {
  id: string
  customerName: string
  startDatetime: string
  endDatetime: string
}

interface MoveAppointmentData {
  appointmentId: string
  startDatetime: string
  endDatetime: string
  force?: boolean
}

type MoveState = 'idle' | 'loading' | 'success' | 'error' | 'conflict'

interface UseMoveAppointmentReturn {
  state: MoveState
  error: string | null
  conflictingAppointments: ConflictingAppointment[]
  moveAppointment: (data: MoveAppointmentData) => Promise<AppointmentResponse | null>
  resetState: () => void
}

export function useMoveAppointment(): UseMoveAppointmentReturn {
  const [state, setState] = useState<MoveState>('idle')
  const [error, setError] = useState<string | null>(null)
  const [conflictingAppointments, setConflictingAppointments] = useState<ConflictingAppointment[]>([])
  const moveAppointment = useCallback(async (data: MoveAppointmentData): Promise<AppointmentResponse | null> => {
    setState('loading')
    setError(null)
    setConflictingAppointments([])
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/appointments/${data.appointmentId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDatetime: data.startDatetime,
          endDatetime: data.endDatetime,
          force: data.force,
        }),
      })
      if (response.status === 409) {
        const errorData = await response.json()
        setState('conflict')
        setConflictingAppointments(errorData.data?.conflictingAppointments ?? [])
        return null
      }
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to move appointment')
      }
      const responseData: { data: AppointmentResponse } = await response.json()
      setState('success')
      return responseData.data
    } catch (err) {
      console.error('Failed to move appointment', {
        appointmentId: data.appointmentId,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to move appointment')
      setState('error')
      return null
    }
  }, [])
  const resetState = useCallback(() => {
    setState('idle')
    setError(null)
    setConflictingAppointments([])
  }, [])
  return { state, error, conflictingAppointments, moveAppointment, resetState }
}
