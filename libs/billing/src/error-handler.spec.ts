import Stripe from 'stripe'
import { describe, expect, it } from 'vitest'
import { handleStripeError } from './error-handler'

describe('error-handler', () => {
  describe('handleStripeError', () => {
    it('handles card errors', () => {
      const error = new Stripe.errors.StripeCardError({
        type: 'card_error',
        message: 'Your card was declined',
        code: 'card_declined',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('card_error')
        expect(result.error.message).toBe('Your card was declined')
        expect(result.error.code).toBe('card_declined')
      }
    })

    it('handles invalid request errors', () => {
      const error = new Stripe.errors.StripeInvalidRequestError({
        type: 'invalid_request_error',
        message: 'Invalid parameter',
        code: 'parameter_invalid',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('invalid_request')
      }
    })

    it('handles API errors', () => {
      const error = new Stripe.errors.StripeAPIError({
        type: 'api_error',
        message: 'API error',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('api_error')
      }
    })

    it('handles connection errors', () => {
      const error = new Stripe.errors.StripeConnectionError({
        type: 'connection_error',
        message: 'Connection failed',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('connection_error')
      }
    })

    it('handles authentication errors', () => {
      const error = new Stripe.errors.StripeAuthenticationError({
        type: 'authentication_error',
        message: 'Invalid API key',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('authentication_error')
      }
    })

    it('handles rate limit errors', () => {
      const error = new Stripe.errors.StripeRateLimitError({
        type: 'rate_limit_error',
        message: 'Too many requests',
      } as unknown as Stripe.StripeRawError)
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('rate_limit_error')
      }
    })

    it('handles unknown errors', () => {
      const error = new Error('Unknown error')
      const result = handleStripeError(error)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('unknown_error')
        expect(result.error.message).toBe('Unknown error')
      }
    })

    it('handles non-Error objects', () => {
      const result = handleStripeError('string error')
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.type).toBe('unknown_error')
        expect(result.error.message).toBe('An unknown error occurred')
      }
    })
  })
})
