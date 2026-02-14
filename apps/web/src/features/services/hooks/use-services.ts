import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'

interface ServiceResponse {
  id: string
  organizationId: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
  active: boolean
  createdAt: string
  updatedAt: string
}

type ServiceState = 'loading' | 'success' | 'error'

interface UseServicesReturn {
  services: ServiceResponse[]
  state: ServiceState
  error: string | null
  refetch: () => Promise<void>
  createService: (data: CreateServiceData) => Promise<ServiceResponse | null>
  updateService: (id: string, data: UpdateServiceData) => Promise<ServiceResponse | null>
  deleteService: (id: string) => Promise<boolean>
  toggleActive: (id: string, active: boolean) => Promise<ServiceResponse | null>
}

interface CreateServiceData {
  name: string
  description?: string
  duration: number
  price: string
  active?: boolean
}

type UpdateServiceData = Partial<CreateServiceData>

export function useServices(): UseServicesReturn {
  const [services, setServices] = useState<ServiceResponse[]>([])
  const [state, setState] = useState<ServiceState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchServices = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/services`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch services')
      }
      const result: { data: ServiceResponse[] } = await response.json()
      setServices(result.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch services', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch services')
      setState('error')
    }
  }, [])
  useEffect(() => {
    fetchServices()
  }, [fetchServices])
  const createService = useCallback(async (data: CreateServiceData): Promise<ServiceResponse | null> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/services`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to create service')
      }
      const result: { data: ServiceResponse } = await response.json()
      setServices(prev => [...prev, result.data])
      return result.data
    } catch (err) {
      console.error('Failed to create service', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  const updateService = useCallback(async (id: string, data: UpdateServiceData): Promise<ServiceResponse | null> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/services/${id}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to update service')
      }
      const result: { data: ServiceResponse } = await response.json()
      setServices(prev => prev.map(s => (s.id === id ? result.data : s)))
      return result.data
    } catch (err) {
      console.error('Failed to update service', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  const deleteService = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/services/${id}`, {
        method: 'DELETE',
        credentials: 'include',
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error?.message ?? 'Failed to delete service')
      }
      setServices(prev => prev.filter(s => s.id !== id))
      return true
    } catch (err) {
      console.error('Failed to delete service', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      throw err
    }
  }, [])
  const toggleActive = useCallback(
    async (id: string, active: boolean): Promise<ServiceResponse | null> => {
      return updateService(id, { active })
    },
    [updateService],
  )
  return {
    services,
    state,
    error,
    refetch: fetchServices,
    createService,
    updateService,
    deleteService,
    toggleActive,
  }
}
