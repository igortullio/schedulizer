import type Stripe from 'stripe'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { verifyWebhookSignature } from './webhook'

describe('webhook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('verifyWebhookSignature', () => {
    it('validates correct signatures', () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'checkout.session.completed',
        data: { object: {} },
      }
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockReturnValue(mockEvent),
        },
      } as unknown as Stripe
      const result = verifyWebhookSignature(mockStripe, '{"id":"evt_123"}', 'valid_signature', 'whsec_test123')
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.id).toBe('evt_123')
      }
    })

    it('rejects invalid signatures', () => {
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockImplementation(() => {
            throw new Error('Invalid signature')
          }),
        },
      } as unknown as Stripe
      const result = verifyWebhookSignature(mockStripe, '{"id":"evt_123"}', 'invalid_signature', 'whsec_test123')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('invalid_request')
        expect(result.error.message).toContain('Invalid signature')
      }
    })

    it('handles webhook secret verification error', () => {
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockImplementation(() => {
            throw new Error('No signatures found matching the expected signature for payload')
          }),
        },
      } as unknown as Stripe
      const result = verifyWebhookSignature(mockStripe, 'payload', 'sig', 'wrong_secret')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('signature')
      }
    })

    it('accepts Buffer payload', () => {
      const mockEvent = {
        id: 'evt_123',
        type: 'customer.subscription.updated',
      }
      const mockStripe = {
        webhooks: {
          constructEvent: vi.fn().mockReturnValue(mockEvent),
        },
      } as unknown as Stripe
      const payloadBuffer = Buffer.from('{"id":"evt_123"}')
      const result = verifyWebhookSignature(mockStripe, payloadBuffer, 'valid_sig', 'whsec_test123')
      expect(result.success).toBe(true)
      expect(mockStripe.webhooks.constructEvent).toHaveBeenCalledWith(payloadBuffer, 'valid_sig', 'whsec_test123')
    })
  })
})
