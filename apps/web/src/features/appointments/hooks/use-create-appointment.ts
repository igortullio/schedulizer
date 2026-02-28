import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'

export interface CreateAppointmentData {
  serviceId: string
  startDatetime: string
  endDatetime: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  status?: 'pending' | 'confirmed' | 'cancelled'
  notes?: string
}

export interface CreateAppointmentResult {
  id: string
  organizationId: string
  serviceId: string
  startDatetime: string
  endDatetime: string
  status: string
  customerName: string
  customerEmail: string | null
  customerPhone: string | null
  notes: string | null
}

type CreateState = 'idle' | 'loading' | 'success' | 'error' | 'conflict'

interface UseCreateAppointmentReturn {
  result: CreateAppointmentResult | null
  state: CreateState
  error: string | null
  createAppointment: (data: CreateAppointmentData) => Promise<CreateAppointmentResult | null>
}

export function useCreateAppointment(): UseCreateAppointmentReturn {
  const [result, setResult] = useState<CreateAppointmentResult | null>(null)
  const [state, setState] = useState<CreateState>('idle')
  const [error, setError] = useState<string | null>(null)
  const createAppointment = useCallback(
    async (data: CreateAppointmentData): Promise<CreateAppointmentResult | null> => {
      setState('loading')
      setError(null)
      try {
        const response = await fetch(`${clientEnv.apiUrl}/api/appointments`, {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        if (response.status === 409) {
          const errorData = await response.json()
          setState('conflict')
          setError(errorData.error ?? 'Time conflict')
          return null
        }
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error ?? 'Failed to create appointment')
        }
        const responseData: { data: CreateAppointmentResult } = await response.json()
        setResult(responseData.data)
        setState('success')
        return responseData.data
      } catch (err) {
        console.error('Failed to create appointment', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        setError(err instanceof Error ? err.message : 'Failed to create appointment')
        setState('error')
        return null
      }
    },
    [],
  )
  return { result, state, error, createAppointment }
}
