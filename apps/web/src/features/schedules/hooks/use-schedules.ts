import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

interface SchedulePeriodResponse {
  id: string
  startTime: string
  endTime: string
}

interface ScheduleResponse {
  dayOfWeek: number
  isActive: boolean
  periods: SchedulePeriodResponse[]
}

interface PeriodInput {
  startTime: string
  endTime: string
}

interface ScheduleInput {
  dayOfWeek: number
  isActive: boolean
  periods: PeriodInput[]
}

type ScheduleState = 'loading' | 'success' | 'error'

interface UseSchedulesReturn {
  schedules: ScheduleResponse[]
  state: ScheduleState
  error: string | null
  refetch: () => Promise<void>
  updateSchedules: (schedules: ScheduleInput[]) => Promise<ScheduleResponse[] | null>
}

export function useSchedules(serviceId: string | undefined): UseSchedulesReturn {
  const [schedules, setSchedules] = useState<ScheduleResponse[]>([])
  const [state, setState] = useState<ScheduleState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchSchedules = useCallback(async () => {
    if (!serviceId) return
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/services/${serviceId}/schedules`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch schedules')
      }
      const result: { data: ScheduleResponse[] } = await response.json()
      setSchedules(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch schedules', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch schedules')
      setState('error')
    }
  }, [serviceId])
  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])
  const updateSchedules = useCallback(
    async (schedulesInput: ScheduleInput[]): Promise<ScheduleResponse[] | null> => {
      if (!serviceId) return null
      try {
        const response = await fetch(`${clientEnv.apiUrl}/api/services/${serviceId}/schedules`, {
          method: 'PUT',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ schedules: schedulesInput }),
        })
        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error?.message ?? 'Failed to update schedules')
        }
        const result: { data: ScheduleResponse[] } = await response.json()
        await fetchSchedules()
        return result.data
      } catch (err) {
        console.error('Failed to update schedules', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        throw err
      }
    },
    [serviceId, fetchSchedules],
  )
  return {
    schedules,
    state,
    error,
    refetch: fetchSchedules,
    updateSchedules,
  }
}
