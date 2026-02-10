export type SubscriptionStatus =
  | 'incomplete'
  | 'incomplete_expired'
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'paused'

export interface Subscription {
  id: string
  organizationId: string
  stripeSubscriptionId: string | null
  stripePriceId: string | null
  status: SubscriptionStatus
  plan: string | null
  currentPeriodStart: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
  createdAt: string
  updatedAt: string
}

export interface Invoice {
  id: string
  number: string | null
  status: string
  amountDue: number
  amountPaid: number
  currency: string
  periodStart: number
  periodEnd: number
  invoicePdf: string | null
  hostedInvoiceUrl: string | null
  created: number
}

export interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
}

export interface SubscriptionResponse {
  data: Subscription | null
}

export interface InvoicesResponse {
  data: Invoice[]
}

export interface PortalResponse {
  data: {
    url: string
  }
}

export interface ApiError {
  error: {
    message: string
    code: string
  }
}
