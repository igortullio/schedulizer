import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

interface TimeBlockResponse {
  id: string
  organizationId: string
  date: string
  startTime: string
  endTime: string
  reason: string | null
  createdAt: string
  updatedAt: string
}

interface CreateTimeBlockData {
  date: string
  startTime: string
  endTime: string
  reason?: string
}

type TimeBlockState = 'loading' | 'success' | 'error'

interface UseTimeBlocksReturn {
  timeBlocks: TimeBlockResponse[]
  state: TimeBlockState
  error: string | null
  refetch: () => Promise<void>
  createTimeBlock: (data: CreateTimeBlockData) => Promise<TimeBlockResponse | null>
  deleteTimeBlock: (id: string) => Promise<boolean>
}

export function useTimeBlocks(from: string, to: string): UseTimeBlocksReturn {
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockResponse[]>([])
  const [state, setState] = useState<TimeBlockState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchTimeBlocks = useCallback(async () => {
    if (!from || !to) return
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/time-blocks?from=${from}&to=${to}`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch time blocks')
      }
      const result: { data: TimeBlockResponse[] } = await response.json()
      setTimeBlocks(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch time blocks', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch time blocks')
      setState('error')
    }
  }, [from, to])
  useEffect(() => {
    fetchTimeBlocks()
  }, [fetchTimeBlocks])
  const createTimeBlock = useCallback(async (data: CreateTimeBlockData): Promise<TimeBlockResponse | null> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/time-blocks`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to create time block')
      }
      const result: { data: TimeBlockResponse } = await response.json()
      setTimeBlocks(prev => [...prev, result.data])
      return result.data
    } catch (err) {
      console.error('Failed to create time block', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  const deleteTimeBlock = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/time-blocks/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to delete time block')
      }
      setTimeBlocks(prev => prev.filter(tb => tb.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete time block', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  return {
    timeBlocks,
    state,
    error,
    refetch: fetchTimeBlocks,
    createTimeBlock,
    deleteTimeBlock,
  }
}
