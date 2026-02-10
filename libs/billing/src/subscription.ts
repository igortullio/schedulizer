import Stripe from 'stripe'
import { handleStripeError } from './error-handler'
import type { BillingResult, Subscription } from './types'

export async function getSubscription(
  stripe: Stripe,
  subscriptionId: string,
): Promise<BillingResult<Subscription | null>> {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId)
    return { success: true, data: subscription }
  } catch (error) {
    if (error instanceof Stripe.errors.StripeInvalidRequestError && error.code === 'resource_missing') {
      return { success: true, data: null }
    }
    return handleStripeError(error)
  }
}

export async function cancelSubscription(
  stripe: Stripe,
  subscriptionId: string,
  cancelAtPeriodEnd = true,
): Promise<BillingResult<Subscription>> {
  try {
    if (cancelAtPeriodEnd) {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      return { success: true, data: subscription }
    }
    const subscription = await stripe.subscriptions.cancel(subscriptionId)
    return { success: true, data: subscription }
  } catch (error) {
    return handleStripeError(error)
  }
}

export async function resumeSubscription(stripe: Stripe, subscriptionId: string): Promise<BillingResult<Subscription>> {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })
    return { success: true, data: subscription }
  } catch (error) {
    return handleStripeError(error)
  }
}
