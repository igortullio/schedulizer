import type Stripe from 'stripe'
import { handleStripeError } from './error-handler'
import type { BillingResult, CheckoutSession, CreateCheckoutSessionParams } from './types'

export async function createCheckoutSession(
  stripe: Stripe,
  params: CreateCheckoutSessionParams,
): Promise<BillingResult<CheckoutSession>> {
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: params.customerId,
      line_items: [
        {
          price: params.priceId,
          quantity: 1,
        },
      ],
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
      subscription_data: {
        metadata: {
          organizationId: params.organizationId,
        },
      },
      metadata: {
        organizationId: params.organizationId,
      },
    })
    return { success: true, data: session }
  } catch (error) {
    return handleStripeError(error)
  }
}

export async function retrieveCheckoutSession(
  stripe: Stripe,
  sessionId: string,
): Promise<BillingResult<CheckoutSession>> {
  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer'],
    })
    return { success: true, data: session }
  } catch (error) {
    return handleStripeError(error)
  }
}
