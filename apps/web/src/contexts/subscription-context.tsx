import { createContext, useContext } from 'react'
import { useSubscription } from '@/features/billing/hooks/use-subscription'
import type { Subscription } from '@/features/billing/types'

interface SubscriptionContextValue {
  subscription: Subscription | null
  hasActiveSubscription: boolean
  isLoading: boolean
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  hasActiveSubscription: false,
  isLoading: true,
})

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { subscription, state } = useSubscription()
  const isLoading = state === 'loading'
  const hasActiveSubscription = subscription !== null && ACTIVE_STATUSES.has(subscription.status)
  return (
    <SubscriptionContext.Provider value={{ subscription, hasActiveSubscription, isLoading }}>
      {children}
    </SubscriptionContext.Provider>
  )
}

export function useSubscriptionContext(): SubscriptionContextValue {
  return useContext(SubscriptionContext)
}
