import Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cancelSubscription, getSubscription, resumeSubscription } from './subscription'

const mockStripe = {
  subscriptions: {
    retrieve: vi.fn(),
    update: vi.fn(),
    cancel: vi.fn(),
  },
} as unknown as Stripe

describe('subscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('getSubscription', () => {
    it('retrieves subscription by ID', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'active',
      }
      vi.mocked(mockStripe.subscriptions.retrieve).mockResolvedValue(mockSubscription as Stripe.Subscription)
      const result = await getSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data?.id).toBe('sub_123')
      }
    })

    it('returns null for non-existent subscription', async () => {
      const stripeError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'No such subscription: sub_invalid',
        code: 'resource_missing',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.subscriptions.retrieve).mockRejectedValue(stripeError)
      const result = await getSubscription(mockStripe, 'sub_invalid')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBeNull()
      }
    })

    it('handles rate limiting errors', async () => {
      const stripeError = new Stripe.errors.StripeRateLimitError({
        type: 'rate_limit_error',
        message: 'Too many requests',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.subscriptions.retrieve).mockRejectedValue(stripeError)
      const result = await getSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('rate_limit_error')
      }
    })
  })

  describe('cancelSubscription', () => {
    it('cancels active subscription at period end by default', async () => {
      const mockSubscription = {
        id: 'sub_123',
        cancel_at_period_end: true,
      }
      vi.mocked(mockStripe.subscriptions.update).mockResolvedValue(mockSubscription as Stripe.Subscription)
      const result = await cancelSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: true,
      })
    })

    it('cancels subscription immediately when specified', async () => {
      const mockSubscription = {
        id: 'sub_123',
        status: 'canceled',
      }
      vi.mocked(mockStripe.subscriptions.cancel).mockResolvedValue(mockSubscription as Stripe.Subscription)
      const result = await cancelSubscription(mockStripe, 'sub_123', false)
      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.cancel).toHaveBeenCalledWith('sub_123')
    })

    it('handles already-canceled subscription error', async () => {
      const stripeError = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'Subscription is already canceled',
        code: 'subscription_invalid_state',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.subscriptions.update).mockRejectedValue(stripeError)
      const result = await cancelSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('invalid_request')
      }
    })

    it('handles network timeout errors', async () => {
      const stripeError = new Stripe.errors.StripeConnectionError({
        type: 'connection_error',
        message: 'Connection timeout',
      } as Stripe.errors.RawErrorType)
      vi.mocked(mockStripe.subscriptions.update).mockRejectedValue(stripeError)
      const result = await cancelSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('connection_error')
      }
    })
  })

  describe('resumeSubscription', () => {
    it('resumes a canceled subscription', async () => {
      const mockSubscription = {
        id: 'sub_123',
        cancel_at_period_end: false,
      }
      vi.mocked(mockStripe.subscriptions.update).mockResolvedValue(mockSubscription as Stripe.Subscription)
      const result = await resumeSubscription(mockStripe, 'sub_123')
      expect(result.success).toBe(true)
      expect(mockStripe.subscriptions.update).toHaveBeenCalledWith('sub_123', {
        cancel_at_period_end: false,
      })
    })
  })
})
