import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { Subscription } from '@/features/billing/types'
import { SubscriptionProvider, useSubscriptionContext } from './subscription-context'

const mockRefetch = vi.fn()

vi.mock('@/features/billing/hooks/use-subscription', () => ({
  useSubscription: () => mockUseSubscription(),
}))

const mockUseSubscription = vi.fn()

function createMockSubscription(overrides: Partial<Subscription> = {}): Subscription {
  return {
    id: 'sub-1',
    organizationId: 'org-1',
    stripeSubscriptionId: 'sub_123',
    stripePriceId: 'price_123',
    status: 'active',
    plan: 'professional',
    currentPeriodStart: '2024-01-01T00:00:00Z',
    currentPeriodEnd: '2024-02-01T00:00:00Z',
    cancelAtPeriodEnd: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
    usage: {
      members: { current: 2, limit: 5, canAdd: true },
      services: { current: 3, limit: null, canAdd: true },
    },
    limits: {
      maxMembers: 5,
      maxServices: null,
      notifications: { email: true, whatsapp: true },
    },
    ...overrides,
  }
}

function createWrapper() {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <SubscriptionProvider>{children}</SubscriptionProvider>
  }
}

describe('SubscriptionContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRefetch.mockResolvedValue(undefined)
  })

  describe('hasActiveSubscription', () => {
    it('returns true for active subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ status: 'active' }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.hasActiveSubscription).toBe(true)
    })

    it('returns true for trialing subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ status: 'trialing' }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.hasActiveSubscription).toBe(true)
    })

    it('returns false for canceled subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ status: 'canceled' }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.hasActiveSubscription).toBe(false)
    })

    it('returns false when subscription is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.hasActiveSubscription).toBe(false)
    })
  })

  describe('plan and limits', () => {
    it('exposes plan type from subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ plan: 'essential' }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.plan).toBe('essential')
    })

    it('returns null plan when subscription is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.plan).toBeNull()
    })

    it('exposes limits from subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.limits).toEqual({
        maxMembers: 5,
        maxServices: null,
        notifications: { email: true, whatsapp: true },
      })
    })

    it('returns null limits when subscription is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.limits).toBeNull()
    })
  })

  describe('usage', () => {
    it('exposes usage data from subscription', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.usage).toEqual({
        members: { current: 2, limit: 5, canAdd: true },
        services: { current: 3, limit: null, canAdd: true },
      })
    })

    it('returns null usage when subscription is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.usage).toBeNull()
    })

    it('returns null usage when subscription has null usage', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ usage: null }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.usage).toBeNull()
    })
  })

  describe('incrementUsage', () => {
    it('increments services count optimistically', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.incrementUsage('services')
      })
      expect(result.current.usage?.services.current).toBe(4)
      expect(result.current.usage?.services.canAdd).toBe(true)
    })

    it('increments members count and updates canAdd', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({
          usage: {
            members: { current: 4, limit: 5, canAdd: true },
            services: { current: 3, limit: null, canAdd: true },
          },
        }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.incrementUsage('members')
      })
      expect(result.current.usage?.members.current).toBe(5)
      expect(result.current.usage?.members.canAdd).toBe(false)
    })

    it('handles unlimited resources (null limit)', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.incrementUsage('services')
      })
      expect(result.current.usage?.services.canAdd).toBe(true)
    })

    it('does nothing when usage is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ usage: null }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.incrementUsage('services')
      })
      expect(result.current.usage).toBeNull()
    })
  })

  describe('decrementUsage', () => {
    it('decrements services count optimistically', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.decrementUsage('services')
      })
      expect(result.current.usage?.services.current).toBe(2)
    })

    it('does not go below zero', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({
          usage: {
            members: { current: 0, limit: 5, canAdd: true },
            services: { current: 3, limit: null, canAdd: true },
          },
        }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.decrementUsage('members')
      })
      expect(result.current.usage?.members.current).toBe(0)
    })

    it('updates canAdd after decrement', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({
          usage: {
            members: { current: 5, limit: 5, canAdd: false },
            services: { current: 3, limit: null, canAdd: true },
          },
        }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.decrementUsage('members')
      })
      expect(result.current.usage?.members.current).toBe(4)
      expect(result.current.usage?.members.canAdd).toBe(true)
    })

    it('does nothing when usage is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.decrementUsage('services')
      })
      expect(result.current.usage).toBeNull()
    })
  })

  describe('refreshSubscription', () => {
    it('clears optimistic usage and refetches', async () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      act(() => {
        result.current.incrementUsage('services')
      })
      expect(result.current.usage?.services.current).toBe(4)
      await act(async () => {
        await result.current.refreshSubscription()
      })
      expect(mockRefetch).toHaveBeenCalledTimes(1)
      expect(result.current.usage?.services.current).toBe(3)
    })
  })

  describe('isLoading', () => {
    it('returns true when state is loading', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'loading',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(true)
    })

    it('returns false when state is success', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription(),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('status', () => {
    it('exposes subscription status', () => {
      mockUseSubscription.mockReturnValue({
        subscription: createMockSubscription({ status: 'trialing' }),
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.status).toBe('trialing')
    })

    it('returns null status when subscription is null', () => {
      mockUseSubscription.mockReturnValue({
        subscription: null,
        state: 'success',
        refetch: mockRefetch,
      })
      const { result } = renderHook(() => useSubscriptionContext(), { wrapper: createWrapper() })
      expect(result.current.status).toBeNull()
    })
  })
})
