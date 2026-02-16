import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'

interface ExceededResource {
  resource: string
  current: number
  limit: number
}

export interface DowngradeValidation {
  canDowngrade: boolean
  currentUsage: {
    members: number
    services: number
  }
  targetLimits: {
    maxMembers: number
    maxServices: number | null
  }
  exceeded?: ExceededResource[]
}

interface DowngradeValidationResponse {
  data: DowngradeValidation
}

type ValidationState = 'idle' | 'loading' | 'success' | 'error'

interface UseValidateDowngradeReturn {
  validation: DowngradeValidation | null
  state: ValidationState
  error: string | null
  validateDowngrade: (targetPlan: string) => Promise<DowngradeValidation | null>
  reset: () => void
}

export function useValidateDowngrade(): UseValidateDowngradeReturn {
  const [validation, setValidation] = useState<DowngradeValidation | null>(null)
  const [state, setState] = useState<ValidationState>('idle')
  const [error, setError] = useState<string | null>(null)
  const validateDowngrade = useCallback(async (targetPlan: string): Promise<DowngradeValidation | null> => {
    setState('loading')
    setError(null)
    setValidation(null)
    try {
      const response = await fetch(
        `${clientEnv.apiUrl}/api/billing/validate-downgrade?targetPlan=${encodeURIComponent(targetPlan)}`,
        {
          method: 'GET',
          credentials: 'include',
        },
      )
      if (!response.ok) {
        throw new Error('Failed to validate downgrade')
      }
      const data: DowngradeValidationResponse = await response.json()
      setValidation(data.data)
      setState('success')
      return data.data
    } catch (err) {
      console.error('Failed to validate downgrade', {
        error: err instanceof Error ? err.message : 'Unknown error',
        targetPlan,
      })
      setError(err instanceof Error ? err.message : 'Failed to validate downgrade')
      setState('error')
      return null
    }
  }, [])
  const reset = useCallback(() => {
    setValidation(null)
    setState('idle')
    setError(null)
  }, [])
  return {
    validation,
    state,
    error,
    validateDowngrade,
    reset,
  }
}
