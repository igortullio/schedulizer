import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'

export interface TimeSlot {
  startTime: string
  endTime: string
}

type SlotsState = 'idle' | 'loading' | 'success' | 'error'

const API_ERROR_TO_I18N_KEY: Record<string, string> = {
  'Date cannot be in the past': 'slots.errors.pastDate',
}

interface UseSlotsReturn {
  slots: TimeSlot[]
  state: SlotsState
  error: string | null
  fetchSlots: (slug: string, serviceId: string, date: string) => Promise<void>
}

export function useSlots(): UseSlotsReturn {
  const [slots, setSlots] = useState<TimeSlot[]>([])
  const [state, setState] = useState<SlotsState>('idle')
  const [error, setError] = useState<string | null>(null)
  const fetchSlots = useCallback(async (slug: string, serviceId: string, date: string) => {
    setState('loading')
    setError(null)
    setSlots([])
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}/services/${serviceId}/slots?date=${date}`)
      if (!response.ok) {
        let errorMessage = 'slots.errors.fetchFailed'
        try {
          const errorData = await response.json()
          const apiMessage = errorData.error?.message
          errorMessage = API_ERROR_TO_I18N_KEY[apiMessage] ?? errorMessage
        } catch {
          // Response is not JSON
        }
        throw new Error(errorMessage)
      }
      const result: { data: { slots: TimeSlot[] } } = await response.json()
      setSlots(result.data.slots)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch slots', {
        slug,
        serviceId,
        date,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'slots.errors.fetchFailed')
      setState('error')
    }
  }, [])
  return { slots, state, error, fetchSlots }
}
