export type BillingFrequency = 'monthly' | 'yearly'

export type PlanId = 'essential' | 'professional'

export interface PlanPricing {
  monthly: number
  yearly: number
}

export interface PlanConfig {
  planId: PlanId
  pricing: PlanPricing
  recommended?: boolean
}

const ANNUAL_DISCOUNT_PERCENT = 15

export const PRICING_CONFIG = {
  annualDiscountPercent: ANNUAL_DISCOUNT_PERCENT,
  currency: {
    'pt-BR': 'BRL',
    en: 'USD',
  },
  locale: {
    'pt-BR': 'pt-BR',
    en: 'en-US',
  },
} as const

export const PLANS: PlanConfig[] = [
  {
    planId: 'essential',
    pricing: {
      monthly: 49.9,
      yearly: 49.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    },
  },
  {
    planId: 'professional',
    pricing: {
      monthly: 99.9,
      yearly: 99.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    },
    recommended: true,
  },
]

export function formatPrice(amount: number, locale: string, currency: string): string {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function getMonthlyEquivalent(yearlyPrice: number): number {
  return yearlyPrice / 12
}

export function calculateYearlySavings(monthlyPrice: number): number {
  const yearlyWithoutDiscount = monthlyPrice * 12
  const yearlyWithDiscount = monthlyPrice * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100)
  return yearlyWithoutDiscount - yearlyWithDiscount
}
