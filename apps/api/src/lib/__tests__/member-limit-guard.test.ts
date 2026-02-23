import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    port: 3000,
    betterAuthSecret: 'a'.repeat(32),
    betterAuthUrl: 'http://localhost:3000',
    frontendUrl: 'http://localhost:4200',
    resendApiKey: 'test-key',
    turnstileSecretKey: 'test-turnstile',
    stripeSecretKey: 'sk_test_123',
    stripeWebhookSecret: 'whsec_test_123',
    stripePriceEssentialMonthly: 'price_essential_monthly',
    stripePriceEssentialYearly: 'price_essential_yearly',
    stripePriceProfessionalMonthly: 'price_professional_monthly',
    stripePriceProfessionalYearly: 'price_professional_yearly',
  },
}))

const mockDbSelect = vi.fn()

vi.mock('@schedulizer/db', () => ({
  createDb: () => ({
    select: (...args: unknown[]) => mockDbSelect(...args),
  }),
  schema: {
    subscriptions: {
      id: 'id',
      stripePriceId: 'stripe_price_id',
      status: 'status',
      organizationId: 'organization_id',
    },
    members: {
      id: 'id',
      organizationId: 'organization_id',
    },
  },
}))

import { checkMemberLimit } from '../member-limit-guard'

interface MockSubscription {
  stripePriceId: string | null
  status: string
}

function setupSubscriptionAndMemberCount(subscription: MockSubscription | null, memberCount: number) {
  mockDbSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(subscription === null ? [] : [subscription])),
      }),
    }),
  })
  if (subscription === null) {
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve([{ value: memberCount }])),
      }),
    })
    return
  }
  mockDbSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve([{ value: memberCount }])),
    }),
  })
}

describe('checkMemberLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Essential Plan', () => {
    it('should allow adding member when no additional members exist (only owner)', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_monthly', status: 'active' }, 0)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
      expect(result.planType).toBe('essential')
    })

    it('should block adding member when Essential plan limit (1) is reached', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_monthly', status: 'active' }, 1)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('limit_exceeded')
      expect(result.current).toBe(1)
      expect(result.limit).toBe(1)
      expect(result.planType).toBe('essential')
    })

    it('should block when member count exceeds limit', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_yearly', status: 'active' }, 3)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.current).toBe(3)
      expect(result.limit).toBe(1)
    })
  })

  describe('Professional Plan', () => {
    it('should allow adding member when under limit', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_professional_monthly', status: 'active' }, 3)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
      expect(result.planType).toBe('professional')
    })

    it('should block adding member when Professional plan limit (5) is reached', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_professional_yearly', status: 'active' }, 5)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('limit_exceeded')
      expect(result.current).toBe(5)
      expect(result.limit).toBe(5)
    })

    it('should allow adding member with 4 members (under limit)', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_professional_monthly', status: 'active' }, 4)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
    })
  })

  describe('Trialing Status', () => {
    it('should treat trialing as Professional plan', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_monthly', status: 'trialing' }, 3)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
      expect(result.planType).toBe('professional')
    })

    it('should block trialing when Professional limit (5) is reached', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_monthly', status: 'trialing' }, 5)
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.limit).toBe(5)
    })
  })

  describe('Fail-safe Behavior', () => {
    it('should allow when no subscription found but org has no members yet (owner creation)', async () => {
      setupSubscriptionAndMemberCount(null, 0)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
      consoleSpy.mockRestore()
    })

    it('should block when no subscription found and org already has members', async () => {
      setupSubscriptionAndMemberCount(null, 1)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.reason).toBe('no_subscription')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plan limit enforcement triggered',
        expect.objectContaining({
          organizationId: 'org-123',
          resource: 'members',
          reason: 'no_subscription',
          action: 'blocked',
        }),
      )
      consoleSpy.mockRestore()
    })

    it('should fall back to Essential limits when stripePriceId is unknown', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_unknown', status: 'active' }, 1)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.planType).toBe('essential')
      expect(result.limit).toBe(1)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to resolve plan type from stripePriceId',
        expect.objectContaining({
          organizationId: 'org-123',
          fallback: 'essential',
        }),
      )
      consoleSpy.mockRestore()
    })

    it('should fall back to Essential limits when stripePriceId is null', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: null, status: 'active' }, 1)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(false)
      expect(result.planType).toBe('essential')
      consoleSpy.mockRestore()
    })

    it('should allow when unknown plan but member count is 0', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_unknown', status: 'active' }, 0)
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await checkMemberLimit('org-123')
      expect(result.allowed).toBe(true)
      expect(result.planType).toBe('essential')
      consoleSpy.mockRestore()
    })
  })

  describe('Logging', () => {
    it('should log when member limit blocks addition', async () => {
      setupSubscriptionAndMemberCount({ stripePriceId: 'price_essential_monthly', status: 'active' }, 1)
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      await checkMemberLimit('org-123')
      expect(consoleSpy).toHaveBeenCalledWith(
        'Plan limit enforcement triggered',
        expect.objectContaining({
          organizationId: 'org-123',
          resource: 'members',
          planType: 'essential',
          currentCount: 1,
          limit: 1,
          action: 'blocked',
        }),
      )
      consoleSpy.mockRestore()
    })
  })
})
