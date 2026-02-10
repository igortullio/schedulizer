import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Success URL must be a valid URL'),
  cancelUrl: z.string().url('Cancel URL must be a valid URL'),
})

const portalSchema = z.object({
  returnUrl: z.string().url('Return URL must be a valid URL'),
})

describe('Billing Validation Schemas', () => {
  describe('Checkout Schema', () => {
    describe('Valid Data', () => {
      it('should accept valid checkout data', () => {
        const validData = {
          priceId: 'price_1234567890',
          successUrl: 'https://app.schedulizer.me/billing/success',
          cancelUrl: 'https://app.schedulizer.me/billing/cancel',
        }
        const result = checkoutSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept localhost URLs for development', () => {
        const validData = {
          priceId: 'price_test_123',
          successUrl: 'http://localhost:4200/billing/success',
          cancelUrl: 'http://localhost:4200/billing/cancel',
        }
        const result = checkoutSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Price ID', () => {
      it('should reject empty priceId', () => {
        const invalidData = {
          priceId: '',
          successUrl: 'https://app.schedulizer.me/billing/success',
          cancelUrl: 'https://app.schedulizer.me/billing/cancel',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Price ID is required')
        }
      })

      it('should reject missing priceId', () => {
        const invalidData = {
          successUrl: 'https://app.schedulizer.me/billing/success',
          cancelUrl: 'https://app.schedulizer.me/billing/cancel',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })

    describe('Invalid URLs', () => {
      it('should reject invalid successUrl', () => {
        const invalidData = {
          priceId: 'price_123',
          successUrl: 'not-a-url',
          cancelUrl: 'https://app.schedulizer.me/billing/cancel',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Success URL must be a valid URL')
        }
      })

      it('should reject invalid cancelUrl', () => {
        const invalidData = {
          priceId: 'price_123',
          successUrl: 'https://app.schedulizer.me/billing/success',
          cancelUrl: 'invalid-url',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Cancel URL must be a valid URL')
        }
      })

      it('should reject missing successUrl', () => {
        const invalidData = {
          priceId: 'price_123',
          cancelUrl: 'https://app.schedulizer.me/billing/cancel',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject missing cancelUrl', () => {
        const invalidData = {
          priceId: 'price_123',
          successUrl: 'https://app.schedulizer.me/billing/success',
        }
        const result = checkoutSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })

  describe('Portal Schema', () => {
    describe('Valid Data', () => {
      it('should accept valid portal data', () => {
        const validData = {
          returnUrl: 'https://app.schedulizer.me/settings/billing',
        }
        const result = portalSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })

      it('should accept localhost URL for development', () => {
        const validData = {
          returnUrl: 'http://localhost:4200/settings/billing',
        }
        const result = portalSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    describe('Invalid Return URL', () => {
      it('should reject invalid returnUrl', () => {
        const invalidData = {
          returnUrl: 'not-a-valid-url',
        }
        const result = portalSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('Return URL must be a valid URL')
        }
      })

      it('should reject empty returnUrl', () => {
        const invalidData = {
          returnUrl: '',
        }
        const result = portalSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })

      it('should reject missing returnUrl', () => {
        const invalidData = {}
        const result = portalSchema.safeParse(invalidData)
        expect(result.success).toBe(false)
      })
    })
  })
})
