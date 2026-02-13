import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

export interface BookingService {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
}

export interface BookingPageData {
  organizationName: string
  slug: string
  services: BookingService[]
}

type BookingPageState = 'loading' | 'success' | 'error' | 'not-found'

interface UseBookingPageReturn {
  data: BookingPageData | null
  state: BookingPageState
  error: string | null
}

export function useBookingPage(slug: string): UseBookingPageReturn {
  const [data, setData] = useState<BookingPageData | null>(null)
  const [state, setState] = useState<BookingPageState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchBookingPage = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/booking/${slug}`)
      if (response.status === 404) {
        setState('not-found')
        return
      }
      if (!response.ok) {
        throw new Error('Failed to fetch booking page')
      }
      const result: { data: BookingPageData } = await response.json()
      setData(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch booking page', {
        slug,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch booking page')
      setState('error')
    }
  }, [slug])
  useEffect(() => {
    fetchBookingPage()
  }, [fetchBookingPage])
  return { data, state, error }
}
