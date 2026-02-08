import type Stripe from 'stripe'
import type { BillingResult, StripeEvent } from './types'

export function verifyWebhookSignature(
  stripe: Stripe,
  payload: string | Buffer,
  signature: string,
  webhookSecret: string,
): BillingResult<StripeEvent> {
  try {
    const event = stripe.webhooks.constructEvent(payload, signature, webhookSecret)
    return { success: true, data: event }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error during webhook verification'
    return {
      success: false,
      error: {
        type: 'invalid_request',
        message: `Webhook signature verification failed: ${errorMessage}`,
      },
    }
  }
}
