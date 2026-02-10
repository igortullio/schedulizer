import { beforeEach, describe, expect, it } from 'vitest'
import { createStripeClient, getStripeClient, resetStripeClient } from './stripe-client'

describe('stripe-client', () => {
  beforeEach(() => {
    resetStripeClient()
  })

  describe('createStripeClient', () => {
    it('creates a Stripe client with valid secret key', () => {
      const client = createStripeClient('sk_test_123456789')
      expect(client).toBeDefined()
    })

    it('throws error when secret key is empty', () => {
      expect(() => createStripeClient('')).toThrow('Stripe secret key is required')
    })

    it('throws error when secret key has invalid format', () => {
      expect(() => createStripeClient('invalid_key')).toThrow('Invalid Stripe secret key format')
    })

    it('throws error when secret key does not start with sk_', () => {
      expect(() => createStripeClient('pk_test_123456789')).toThrow('Invalid Stripe secret key format')
    })
  })

  describe('getStripeClient', () => {
    it('returns the same instance on multiple calls', () => {
      const client1 = getStripeClient('sk_test_123456789')
      const client2 = getStripeClient('sk_test_123456789')
      expect(client1).toBe(client2)
    })

    it('creates new instance after reset', () => {
      const client1 = getStripeClient('sk_test_123456789')
      resetStripeClient()
      const client2 = getStripeClient('sk_test_123456789')
      expect(client1).not.toBe(client2)
    })
  })
})
