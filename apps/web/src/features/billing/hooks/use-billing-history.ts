import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'
import type { Invoice, InvoicesResponse } from '../types'

type BillingHistoryState = 'loading' | 'success' | 'error'

interface UseBillingHistoryReturn {
  invoices: Invoice[]
  state: BillingHistoryState
  error: string | null
  refetch: () => Promise<void>
}

export function useBillingHistory(): UseBillingHistoryReturn {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [state, setState] = useState<BillingHistoryState>('loading')
  const [error, setError] = useState<string | null>(null)
  const fetchInvoices = useCallback(async () => {
    setState('loading')
    setError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/billing/invoices`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch invoices')
      }
      const data: InvoicesResponse = await response.json()
      setInvoices(data.data)
      setState('success')
    } catch (err) {
      console.error('Failed to fetch invoices', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError(err instanceof Error ? err.message : 'Failed to fetch invoices')
      setState('error')
    }
  }, [])
  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])
  return {
    invoices,
    state,
    error,
    refetch: fetchInvoices,
  }
}
