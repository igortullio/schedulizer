import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useState } from 'react'

export interface UpdateUserData {
  phoneNumber?: string
  email?: string
}

export interface UpdateUserResult {
  id: string
  phoneNumber: string | null
  email: string | null
}

type UpdateState = 'idle' | 'loading' | 'success' | 'error'

interface UseUpdateUserReturn {
  result: UpdateUserResult | null
  state: UpdateState
  error: string | null
  updateUser: (userId: string, data: UpdateUserData) => Promise<UpdateUserResult | null>
}

export function useUpdateUser(): UseUpdateUserReturn {
  const [result, setResult] = useState<UpdateUserResult | null>(null)
  const [state, setState] = useState<UpdateState>('idle')
  const [error, setError] = useState<string | null>(null)
  const updateUser = useCallback(async (userId: string, data: UpdateUserData): Promise<UpdateUserResult | null> => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/users/${userId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to update user')
      }
      const responseData: { data: UpdateUserResult } = await response.json()
      setResult(responseData.data)
      setState('success')
      return responseData.data
    } catch (err) {
      console.error('Failed to update user', {
        userId,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to update user')
      setState('error')
      return null
    }
  }, [])
  return { result, state, error, updateUser }
}
