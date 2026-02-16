import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useSubscription } from '@/features/billing/hooks/use-subscription'
import type { PlanType, Subscription, SubscriptionLimits, UsageData } from '@/features/billing/types'

type UsageResource = 'members' | 'services'

interface SubscriptionContextValue {
  subscription: Subscription | null
  hasActiveSubscription: boolean
  plan: PlanType | null
  status: string | null
  usage: UsageData | null
  limits: SubscriptionLimits | null
  isLoading: boolean
  incrementUsage: (resource: UsageResource) => void
  decrementUsage: (resource: UsageResource) => void
  refreshSubscription: () => Promise<void>
}

const SubscriptionContext = createContext<SubscriptionContextValue>({
  subscription: null,
  hasActiveSubscription: false,
  plan: null,
  status: null,
  usage: null,
  limits: null,
  isLoading: true,
  incrementUsage: () => {},
  decrementUsage: () => {},
  refreshSubscription: async () => {},
})

const ACTIVE_STATUSES = new Set(['active', 'trialing'])

function computeCanAdd(current: number, limit: number | null): boolean {
  if (limit === null) return true
  return current < limit
}

function adjustUsage(usage: UsageData, resource: UsageResource, delta: number): UsageData {
  const resourceUsage = usage[resource]
  const newCurrent = Math.max(0, resourceUsage.current + delta)
  return {
    ...usage,
    [resource]: {
      ...resourceUsage,
      current: newCurrent,
      canAdd: computeCanAdd(newCurrent, resourceUsage.limit),
    },
  }
}

export function SubscriptionProvider({ children }: { children: React.ReactNode }) {
  const { subscription, state, refetch } = useSubscription()
  const [optimisticUsage, setOptimisticUsage] = useState<UsageData | null>(null)
  const isLoading = state === 'loading'
  const hasActiveSubscription = subscription !== null && ACTIVE_STATUSES.has(subscription.status)
  const usage = optimisticUsage ?? subscription?.usage ?? null
  const incrementUsage = useCallback(
    (resource: UsageResource) => {
      const baseUsage = optimisticUsage ?? subscription?.usage
      if (!baseUsage) return
      setOptimisticUsage(adjustUsage(baseUsage, resource, 1))
    },
    [optimisticUsage, subscription?.usage],
  )
  const decrementUsage = useCallback(
    (resource: UsageResource) => {
      const baseUsage = optimisticUsage ?? subscription?.usage
      if (!baseUsage) return
      setOptimisticUsage(adjustUsage(baseUsage, resource, -1))
    },
    [optimisticUsage, subscription?.usage],
  )
  const refreshSubscription = useCallback(async () => {
    setOptimisticUsage(null)
    await refetch()
  }, [refetch])
  const value = useMemo<SubscriptionContextValue>(
    () => ({
      subscription,
      hasActiveSubscription,
      plan: subscription?.plan ?? null,
      status: subscription?.status ?? null,
      usage,
      limits: subscription?.limits ?? null,
      isLoading,
      incrementUsage,
      decrementUsage,
      refreshSubscription,
    }),
    [subscription, hasActiveSubscription, usage, isLoading, incrementUsage, decrementUsage, refreshSubscription],
  )
  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>
}

export function useSubscriptionContext(): SubscriptionContextValue {
  return useContext(SubscriptionContext)
}
