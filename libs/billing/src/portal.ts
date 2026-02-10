import type Stripe from 'stripe'
import { handleStripeError } from './error-handler'
import type { BillingResult, CreatePortalSessionParams, PortalSession } from './types'

export async function createPortalSession(
  stripe: Stripe,
  params: CreatePortalSessionParams,
): Promise<BillingResult<PortalSession>> {
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: params.customerId,
      return_url: params.returnUrl,
    })
    return { success: true, data: session }
  } catch (error) {
    return handleStripeError(error)
  }
}
