import type Stripe from 'stripe'

export type SubscriptionStatus = Stripe.Subscription.Status

export type CheckoutSession = Stripe.Checkout.Session

export type Subscription = Stripe.Subscription

export type PortalSession = Stripe.BillingPortal.Session

export type StripeEvent = Stripe.Event

export interface CreateCheckoutSessionParams {
  organizationId: string
  customerId: string
  priceId: string
  successUrl: string
  cancelUrl: string
}

export interface CreatePortalSessionParams {
  customerId: string
  returnUrl: string
}

export interface WebhookVerificationResult {
  event: StripeEvent
}

export interface BillingError {
  type:
    | 'card_error'
    | 'invalid_request'
    | 'api_error'
    | 'connection_error'
    | 'authentication_error'
    | 'rate_limit_error'
    | 'unknown_error'
  message: string
  code?: string
}

export type BillingResult<T> = { success: true; data: T } | { success: false; error: BillingError }
