import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'

const DEFAULT_LOCALE = 'pt-BR'

interface CreateAppointmentData {
  serviceId: string
  startTime: string
  customerName: string
  customerEmail: string
  customerPhone: string
}

export interface AppointmentResult {
  id: string
  startDatetime: string
  endDatetime: string
  status: string
  managementToken: string
}

type CreateState = 'idle' | 'loading' | 'success' | 'error' | 'conflict'

interface UseCreateAppointmentReturn {
  result: AppointmentResult | null
  state: CreateState
  error: string | null
  createAppointment: (slug: string, data: CreateAppointmentData, locale?: string) => Promise<AppointmentResult | null>
}

export function useCreateAppointment(): UseCreateAppointmentReturn {
  const [result, setResult] = useState<AppointmentResult | null>(null)
  const [state, setState] = useState<CreateState>('idle')
  const [error, setError] = useState<string | null>(null)
  const createAppointment = useCallback(
    async (slug: string, data: CreateAppointmentData, locale?: string): Promise<AppointmentResult | null> => {
      setState('loading')
      setError(null)
      try {
        const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept-Language': locale ?? DEFAULT_LOCALE },
          body: JSON.stringify(data),
        })
        if (response.status === 409) {
          setState('conflict')
          setError('Slot no longer available')
          return null
        }
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message ?? 'Failed to create appointment')
        }
        const responseData: { data: AppointmentResult } = await response.json()
        setResult(responseData.data)
        setState('success')
        return responseData.data
      } catch (err) {
        console.error('Failed to create appointment', {
          slug,
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
