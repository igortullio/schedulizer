import Stripe from 'stripe'
import type { BillingError, BillingResult } from './types'

export function handleStripeError<T>(error: unknown): BillingResult<T> {
  if (error instanceof Stripe.errors.StripeError) {
    const billingError = mapStripeError(error)
    return { success: false, error: billingError }
  }
  return {
    success: false,
    error: {
      type: 'unknown_error',
      message: error instanceof Error ? error.message : 'An unknown error occurred',
    },
  }
}

function mapStripeError(error: Stripe.errors.StripeError): BillingError {
  switch (error.type) {
    case 'StripeCardError':
      return {
        type: 'card_error',
        message: error.message,
        code: error.code,
      }
    case 'StripeInvalidRequestError':
      return {
        type: 'invalid_request',
        message: error.message,
        code: error.code,
      }
    case 'StripeAPIError':
      return {
        type: 'api_error',
        message: error.message,
      }
    case 'StripeConnectionError':
      return {
        type: 'connection_error',
        message: error.message,
      }
    case 'StripeAuthenticationError':
      return {
        type: 'authentication_error',
        message: error.message,
      }
    case 'StripeRateLimitError':
      return {
        type: 'rate_limit_error',
        message: error.message,
      }
    default:
      return {
        type: 'unknown_error',
        message: error.message,
      }
  }
}
