import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { createCheckoutSession, retrieveCheckoutSession } from './checkout'

const mockStripe = {
  checkout: {
    sessions: {
      create: vi.fn(),
      retrieve: vi.fn(),
    },
  },
} as unknown as Stripe

describe('checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createCheckoutSession', () => {
    const params = {
      organizationId: 'org_123',
      customerId: 'cus_123',
      priceId: 'price_123',
      successUrl: 'https://example.com/success',
      cancelUrl: 'https://example.com/cancel',
    }

    it('returns valid session object on success', async () => {
      const mockSession = {
        id: 'cs_test_123',
        url: 'https://checkout.stripe.com/pay/cs_test_123',
      }
      vi.mocked(mockStripe.checkout.sessions.create).mockResolvedValue(mockSession as Stripe.Checkout.Session)
      const result = await createCheckoutSession(mockStripe, params)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('cs_test_123')
      }
    })

    it('calls Stripe with correct parameters', async () => {
      const mockSession = { id: 'cs_test_123' }
      vi.mocked(mockStripe.checkout.sessions.create).mockResolvedValue(mockSession as Stripe.Checkout.Session)
      await createCheckoutSession(mockStripe, params)
      expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
        mode: 'subscription',
        customer: 'cus_123',
        line_items: [{ price: 'price_123', quantity: 1 }],
        success_url: 'https://example.com/success',
        cancel_url: 'https://example.com/cancel',
        subscription_data: { metadata: { organizationId: 'org_123' } },
        metadata: { organizationId: 'org_123' },
      })
    })

    it('handles invalid priceId error', async () => {
      const stripeError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'No such price: price_invalid',
        code: 'resource_missing',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(stripeError)
      const result = await createCheckoutSession(mockStripe, { ...params, priceId: 'price_invalid' })
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
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(stripeError)
      const result = await createCheckoutSession(mockStripe, params)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('rate_limit_error')
      }
    })

    it('handles network timeout errors', async () => {
      const stripeError = new Stripe.errors.StripeConnectionError({
        type: 'connection_error',
        message: 'Connection timeout',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.checkout.sessions.create).mockRejectedValue(stripeError)
      const result = await createCheckoutSession(mockStripe, params)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('connection_error')
      }
    })
  })

  describe('retrieveCheckoutSession', () => {
    it('retrieves session by id', async () => {
      const mockSession = {
        id: 'cs_test_123',
        status: 'complete',
      }
      vi.mocked(mockStripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as Stripe.Checkout.Session)
      const result = await retrieveCheckoutSession(mockStripe, 'cs_test_123')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('cs_test_123')
      }
    })

    it('expands subscription and customer', async () => {
      const mockSession = { id: 'cs_test_123' }
      vi.mocked(mockStripe.checkout.sessions.retrieve).mockResolvedValue(mockSession as Stripe.Checkout.Session)
      await retrieveCheckoutSession(mockStripe, 'cs_test_123')
      expect(mockStripe.checkout.sessions.retrieve).toHaveBeenCalledWith('cs_test_123', {
        expand: ['subscription', 'customer'],
      })
    })
  })
})
