import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createPortalSession } from './portal'

const mockStripe = {
  billingPortal: {
    sessions: {
      create: vi.fn(),
    },
  },
} as unknown as Stripe

describe('portal', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createPortalSession', () => {
    const params = {
      customerId: 'cus_123',
      returnUrl: 'https://example.com/account',
    }

    it('returns valid portal URL', async () => {
      const mockSession = {
        id: 'bps_123',
        url: 'https://billing.stripe.com/session/bps_123',
      }
      vi.mocked(mockStripe.billingPortal.sessions.create).mockResolvedValue(mockSession as Stripe.BillingPortal.Session)
      const result = await createPortalSession(mockStripe, params)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.url).toBe('https://billing.stripe.com/session/bps_123')
      }
    })

    it('calls Stripe with correct parameters', async () => {
      const mockSession = { id: 'bps_123', url: 'https://billing.stripe.com/session/bps_123' }
      vi.mocked(mockStripe.billingPortal.sessions.create).mockResolvedValue(mockSession as Stripe.BillingPortal.Session)
      await createPortalSession(mockStripe, params)
      expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
        customer: 'cus_123',
        return_url: 'https://example.com/account',
      })
    })

    it('handles invalid customerId error', async () => {
      const stripeError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'No such customer: cus_invalid',
        code: 'resource_missing',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.billingPortal.sessions.create).mockRejectedValue(stripeError)
      const result = await createPortalSession(mockStripe, { ...params, customerId: 'cus_invalid' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('invalid_request')
      }
    })

    it('handles rate limiting errors', async () => {
      const stripeError = new Stripe.errors.StripeRateLimitError({
        type: 'rate_limit_error',
        message: 'Too many requests',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.billingPortal.sessions.create).mockRejectedValue(stripeError)
      const result = await createPortalSession(mockStripe, params)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('rate_limit_error')
      }
    })
  })
})
