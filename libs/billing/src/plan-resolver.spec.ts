import { describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    stripePriceEssentialMonthly: 'price_essential_monthly',
    stripePriceEssentialYearly: 'price_essential_yearly',
    stripePriceProfessionalMonthly: 'price_professional_monthly',
    stripePriceProfessionalYearly: 'price_professional_yearly',
  },
}))

import { resolvePlanFromSubscription, resolvePlanType } from './plan-resolver'

describe('plan-resolver', () => {
  describe('resolvePlanType', () => {
    it('resolves essential monthly price ID', () => {
      expect(resolvePlanType('price_essential_monthly')).toBe('essential')
    })

    it('resolves essential yearly price ID', () => {
      expect(resolvePlanType('price_essential_yearly')).toBe('essential')
    })

    it('resolves professional monthly price ID', () => {
      expect(resolvePlanType('price_professional_monthly')).toBe('professional')
    })

    it('resolves professional yearly price ID', () => {
      expect(resolvePlanType('price_professional_yearly')).toBe('professional')
    })

    it('returns null for unknown price ID', () => {
      expect(resolvePlanType('price_unknown')).toBeNull()
    })

    it('returns null for empty string', () => {
      expect(resolvePlanType('')).toBeNull()
    })
  })

  describe('resolvePlanFromSubscription', () => {
    it('resolves active subscription with essential price', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: 'price_essential_monthly',
        status: 'active',
      })
      expect(result).not.toBeNull()
      expect(result!.type).toBe('essential')
      expect(result!.limits.maxMembers).toBe(1)
      expect(result!.limits.maxServices).toBe(5)
      expect(result!.stripePriceId).toBe('price_essential_monthly')
    })

    it('resolves active subscription with professional price', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: 'price_professional_yearly',
        status: 'active',
      })
      expect(result).not.toBeNull()
      expect(result!.type).toBe('professional')
      expect(result!.limits.maxMembers).toBe(5)
      expect(result!.limits.maxServices).toBe(Infinity)
    })

    it('resolves trialing subscription as professional', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: 'price_essential_monthly',
        status: 'trialing',
      })
      expect(result).not.toBeNull()
      expect(result!.type).toBe('professional')
      expect(result!.limits.maxMembers).toBe(5)
      expect(result!.limits.maxServices).toBe(Infinity)
    })

    it('resolves trialing subscription with null price as professional', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: null,
        status: 'trialing',
      })
      expect(result).not.toBeNull()
      expect(result!.type).toBe('professional')
      expect(result!.stripePriceId).toBe('')
    })

    it('returns null for subscription with null price ID', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: null,
        status: 'active',
      })
      expect(result).toBeNull()
    })

    it('returns null for subscription with unknown price ID', () => {
      const result = resolvePlanFromSubscription({
        stripePriceId: 'price_unknown',
        status: 'active',
      })
      expect(result).toBeNull()
    })
  })
})
