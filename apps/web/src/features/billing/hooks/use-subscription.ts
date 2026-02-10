import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'
import type { Subscription, SubscriptionResponse } from '../types'

type SubscriptionState = 'loading' | 'success' | 'error'

interface UseSubscriptionReturn {
  subscription: Subscription | null
  state: SubscriptionState
  error: string | null
  refetch: () => Promise<void>
}

export function useSubscription(): UseSubscriptionReturn {
  const [subscription, setSubscription] = useState<Subscription | null>(null)
  const [state, setState] = useState<SubscriptionState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchSubscription = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/billing/subscription`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch subscription')
      }
      const data: SubscriptionResponse = await response.json()
      setSubscription(data.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch subscription', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch subscription')
      setState('error')
    }
  }, [])
  useEffect(() => {
    fetchSubscription()
  }, [fetchSubscription])
  return {
    subscription,
    state,
    error,
    refetch: fetchSubscription,
  }
}
