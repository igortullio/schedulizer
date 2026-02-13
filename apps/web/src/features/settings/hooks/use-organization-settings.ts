import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

interface OrganizationSettings {
  slug: string
  timezone: string
}

type SettingsState = 'loading' | 'success' | 'error'

interface UseOrganizationSettingsReturn {
  settings: OrganizationSettings | null
  state: SettingsState
  error: string | null
  updateSettings: (data: UpdateSettingsData) => Promise<OrganizationSettings | null>
  refetch: () => Promise<void>
}

interface UpdateSettingsData {
  slug?: string
  timezone?: string
}

export function useOrganizationSettings(): UseOrganizationSettingsReturn {
  const [settings, setSettings] = useState<OrganizationSettings | null>(null)
  const [state, setState] = useState<SettingsState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchSettings = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/organizations/settings`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch organization settings')
      }
      const result: { data: OrganizationSettings } = await response.json()
      setSettings(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch organization settings', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch organization settings')
      setState('error')
    }
  }, [])
  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])
  const updateSettings = useCallback(async (data: UpdateSettingsData): Promise<OrganizationSettings | null> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/organizations/settings`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to update organization settings')
      }
      const result: { data: OrganizationSettings } = await response.json()
      setSettings(result.data)
      return result.data
    } catch (err) {
      console.error('Failed to update organization settings', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  return {
    settings,
    state,
    error,
    updateSettings,
    refetch: fetchSettings,
  }
}
