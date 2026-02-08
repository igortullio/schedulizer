import { describe, expect, it } from 'vitest'
import { calculateYearlySavings, formatPrice, getMonthlyEquivalent, PLANS, PRICING_CONFIG } from './pricing-data'

describe('Pricing Data', () => {
  describe('PLANS', () => {
    it('should have two plans defined', () => {
      expect(PLANS).toHaveLength(2)
    })

    it('should have essential plan', () => {
      const essential = PLANS.find(p => p.planId === 'essential')
      expect(essential).toBeDefined()
      expect(essential?.pricing.monthly).toBe(49.9)
    })

    it('should have professional plan marked as recommended', () => {
      const professional = PLANS.find(p => p.planId === 'professional')
      expect(professional).toBeDefined()
      expect(professional?.recommended).toBe(true)
      expect(professional?.pricing.monthly).toBe(99.9)
    })

    it('should have yearly pricing with 15% discount', () => {
      const essential = PLANS.find(p => p.planId === 'essential')
      const expectedYearly = 49.9 * 12 * 0.85
      expect(essential?.pricing.yearly).toBeCloseTo(expectedYearly, 2)
    })
  })

  describe('PRICING_CONFIG', () => {
    it('should have 15% annual discount', () => {
      expect(PRICING_CONFIG.annualDiscountPercent).toBe(15)
    })

    it('should have currency configuration for pt-BR and en', () => {
      expect(PRICING_CONFIG.currency['pt-BR']).toBe('BRL')
      expect(PRICING_CONFIG.currency.en).toBe('USD')
    })

    it('should have locale configuration for pt-BR and en', () => {
      expect(PRICING_CONFIG.locale['pt-BR']).toBe('pt-BR')
      expect(PRICING_CONFIG.locale.en).toBe('en-US')
    })
  })

  describe('formatPrice', () => {
    it('should format price in BRL', () => {
      const result = formatPrice(49.9, 'pt-BR', 'BRL')
      expect(result).toContain('49,90')
      expect(result).toContain('R$')
    })

    it('should format price in USD', () => {
      const result = formatPrice(49.9, 'en-US', 'USD')
      expect(result).toContain('49.90')
      expect(result).toContain('$')
    })
  })

  describe('getMonthlyEquivalent', () => {
    it('should calculate monthly equivalent from yearly price', () => {
      const yearlyPrice = 508.98
      const result = getMonthlyEquivalent(yearlyPrice)
      expect(result).toBeCloseTo(42.415, 2)
    })
  })

  describe('calculateYearlySavings', () => {
    it('should calculate savings with 15% discount', () => {
      const monthlyPrice = 49.9
      const expectedSavings = monthlyPrice * 12 * 0.15
      const result = calculateYearlySavings(monthlyPrice)
      expect(result).toBeCloseTo(expectedSavings, 2)
    })
  })
})
