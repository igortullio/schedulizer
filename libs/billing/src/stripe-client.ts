import Stripe from 'stripe'

const STRIPE_API_VERSION = '2025-01-27.acacia' as const

let stripeInstance: Stripe | null = null

export function createStripeClient(secretKey: string): Stripe {
  if (!secretKey) {
    throw new Error('Stripe secret key is required')
  }
  if (!secretKey.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format')
  }
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    maxNetworkRetries: 2,
    timeout: 10000,
  })
}

export function getStripeClient(secretKey: string): Stripe {
  if (!stripeInstance) {
    stripeInstance = createStripeClient(secretKey)
  }
  return stripeInstance
}

export function resetStripeClient(): void {
  stripeInstance = null
}
