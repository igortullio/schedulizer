import { clientEnv } from '@schedulizer/env/client'
import { loadStripe, type Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null

export function getStripePromise(): Promise<Stripe | null> {
  if (!stripePromise) {
    stripePromise = loadStripe(clientEnv.stripePublishableKey)
  }
  return stripePromise
}
