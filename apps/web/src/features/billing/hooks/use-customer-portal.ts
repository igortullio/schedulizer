import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'
import type { ApiError, PortalResponse } from '../types'

type PortalState = 'idle' | 'loading' | 'error'

interface UseCustomerPortalReturn {
  state: PortalState
  error: string | null
  openPortal: () => Promise<void>
}

function isApiError(data: PortalResponse | ApiError): data is ApiError {
  return 'error' in data
}

export function useCustomerPortal(): UseCustomerPortalReturn {
  const [state, setState] = useState<PortalState>('idle')
  const [error, setError] = useState<string | null>(null)
  const openPortal = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const returnUrl = `${window.location.origin}/subscription`
      const response = await fetch(`${clientEnv.apiUrl}/api/billing/portal`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ returnUrl }),
      })
      const data: PortalResponse | ApiError = await response.json()
      if (!response.ok || isApiError(data)) {
        const errorData = isApiError(data) ? data : { error: { message: 'Failed to open portal' } }
        throw new Error(errorData.error.message)
      }
      console.log('Redirecting to customer portal')
      window.location.href = data.data.url
    } catch (err) {
      console.error('Failed to open customer portal', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to open portal')
      setState('error')
    }
  }, [])
  return {
    state,
    error,
    openPortal,
  }
}
