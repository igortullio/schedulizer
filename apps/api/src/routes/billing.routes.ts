import {
  createCheckoutSession,
  createPortalSession,
  getStripeClient,
  verifyWebhookSignature,
} from '@schedulizer/billing'
import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { fromNodeHeaders } from 'better-auth/node'
import { eq } from 'drizzle-orm'
import { Router, raw } from 'express'
import type Stripe from 'stripe'
import { z } from 'zod'
import { auth } from '../lib/auth'

const router = Router()
const db = createDb(serverEnv.databaseUrl)
const stripe = getStripeClient(serverEnv.stripeSecretKey)

const checkoutSchema = z.object({
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Success URL must be a valid URL'),
  cancelUrl: z.string().url('Cancel URL must be a valid URL'),
})

const portalSchema = z.object({
  returnUrl: z.string().url('Return URL must be a valid URL'),
})

async function getOrCreateCustomer(organizationId: string, email: string): Promise<string> {
  const existingSubscription = await db
    .select({ stripeCustomerId: schema.subscriptions.stripeCustomerId })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.organizationId, organizationId))
    .limit(1)
  if (existingSubscription.length > 0 && existingSubscription[0].stripeCustomerId) {
    return existingSubscription[0].stripeCustomerId
  }
  const customer = await stripe.customers.create({
    email,
    metadata: { organizationId },
  })
  await db.insert(schema.subscriptions).values({
    organizationId,
    stripeCustomerId: customer.id,
    status: 'incomplete',
  })
  console.log('Stripe customer created', { organizationId, customerId: customer.id })
  return customer.id
}

router.post('/checkout', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const activeOrgId = session.session.activeOrganizationId
    if (!activeOrgId) {
      return res.status(400).json({
        error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' },
      })
    }
    const validation = checkoutSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { priceId, successUrl, cancelUrl } = validation.data
    const customerId = await getOrCreateCustomer(activeOrgId, session.user.email)
    const result = await createCheckoutSession(stripe, {
      organizationId: activeOrgId,
      customerId,
      priceId,
      successUrl,
      cancelUrl,
    })
    if (!result.success) {
      console.error('Failed to create checkout session', {
        organizationId: activeOrgId,
        error: result.error.message,
      })
      return res.status(422).json({
        error: { message: result.error.message, code: 'CHECKOUT_FAILED' },
      })
    }
    console.log('Checkout session created', {
      organizationId: activeOrgId,
      sessionId: result.data.id,
    })
    return res.status(200).json({
      data: { url: result.data.url, sessionId: result.data.id },
    })
  } catch (error) {
    console.error('Checkout endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.post('/portal', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const activeOrgId = session.session.activeOrganizationId
    if (!activeOrgId) {
      return res.status(400).json({
        error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' },
      })
    }
    const validation = portalSchema.safeParse(req.body)
    if (!validation.success) {
      return res.status(400).json({
        error: {
          message: validation.error.issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', '),
          code: 'INVALID_REQUEST',
        },
      })
    }
    const { returnUrl } = validation.data
    const subscription = await db
      .select({ stripeCustomerId: schema.subscriptions.stripeCustomerId })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.organizationId, activeOrgId))
      .limit(1)
    if (subscription.length === 0 || !subscription[0].stripeCustomerId) {
      return res.status(404).json({
        error: { message: 'No billing information found for this organization', code: 'NOT_FOUND' },
      })
    }
    const result = await createPortalSession(stripe, {
      customerId: subscription[0].stripeCustomerId,
      returnUrl,
    })
    if (!result.success) {
      console.error('Failed to create portal session', {
        organizationId: activeOrgId,
        error: result.error.message,
      })
      return res.status(422).json({
        error: { message: result.error.message, code: 'PORTAL_FAILED' },
      })
    }
    console.log('Portal session created', {
      organizationId: activeOrgId,
    })
    return res.status(200).json({
      data: { url: result.data.url },
    })
  } catch (error) {
    console.error('Portal endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

router.get('/subscription', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const activeOrgId = session.session.activeOrganizationId
    if (!activeOrgId) {
      return res.status(400).json({
        error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' },
      })
    }
    const subscription = await db
      .select()
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.organizationId, activeOrgId))
      .limit(1)
    if (subscription.length === 0) {
      return res.status(200).json({
        data: null,
      })
    }
    const { stripeCustomerId, ...subscriptionData } = subscription[0]
    return res.status(200).json({
      data: subscriptionData,
    })
  } catch (error) {
    console.error('Subscription endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

const DEFAULT_INVOICE_LIMIT = 12

router.get('/invoices', async (req, res) => {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const activeOrgId = session.session.activeOrganizationId
    if (!activeOrgId) {
      return res.status(400).json({
        error: { message: 'No active organization selected', code: 'NO_ACTIVE_ORG' },
      })
    }
    const subscription = await db
      .select({ stripeCustomerId: schema.subscriptions.stripeCustomerId })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.organizationId, activeOrgId))
      .limit(1)
    if (subscription.length === 0 || !subscription[0].stripeCustomerId) {
      return res.status(200).json({
        data: [],
      })
    }
    const invoices = await stripe.invoices.list({
      customer: subscription[0].stripeCustomerId,
      limit: DEFAULT_INVOICE_LIMIT,
    })
    const formattedInvoices = invoices.data.map(invoice => ({
      id: invoice.id,
      number: invoice.number,
      status: invoice.status,
      amountDue: invoice.amount_due,
      amountPaid: invoice.amount_paid,
      currency: invoice.currency,
      periodStart: invoice.period_start,
      periodEnd: invoice.period_end,
      invoicePdf: invoice.invoice_pdf,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
      created: invoice.created,
    }))
    console.log('Invoices fetched', {
      organizationId: activeOrgId,
      count: formattedInvoices.length,
    })
    return res.status(200).json({
      data: formattedInvoices,
    })
  } catch (error) {
    console.error('Invoices endpoint error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

interface SubscriptionItemPeriod {
  current_period_start: number
  current_period_end: number
}

function getSubscriptionPeriodDates(subscription: Stripe.Subscription) {
  const item = subscription.items.data[0] as unknown as SubscriptionItemPeriod
  return {
    currentPeriodStart: new Date(item.current_period_start * 1000),
    currentPeriodEnd: new Date(item.current_period_end * 1000),
  }
}

async function handleCheckoutSessionCompleted(checkoutSession: Stripe.Checkout.Session) {
  const organizationId = checkoutSession.metadata?.organizationId
  if (!organizationId) {
    console.error('Webhook: checkout.session.completed missing organizationId', {
      sessionId: checkoutSession.id,
    })
    return
  }
  const subscription = checkoutSession.subscription as Stripe.Subscription | string | null
  const subscriptionId = typeof subscription === 'string' ? subscription : subscription?.id
  if (!subscriptionId) {
    console.error('Webhook: checkout.session.completed missing subscription', {
      sessionId: checkoutSession.id,
      organizationId,
    })
    return
  }
  const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId)
  const periodDates = getSubscriptionPeriodDates(stripeSubscription)
  await db
    .update(schema.subscriptions)
    .set({
      stripeSubscriptionId: subscriptionId,
      stripePriceId: stripeSubscription.items.data[0]?.price.id,
      status: stripeSubscription.status,
      plan: stripeSubscription.items.data[0]?.price.nickname ?? null,
      currentPeriodStart: periodDates.currentPeriodStart,
      currentPeriodEnd: periodDates.currentPeriodEnd,
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.organizationId, organizationId))
  console.log('Subscription activated', {
    organizationId,
    subscriptionId,
    status: stripeSubscription.status,
  })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const periodDates = getSubscriptionPeriodDates(subscription)
  const organizationId = subscription.metadata?.organizationId
  if (!organizationId) {
    const existingSubscription = await db
      .select({ organizationId: schema.subscriptions.organizationId })
      .from(schema.subscriptions)
      .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
      .limit(1)
    if (existingSubscription.length === 0) {
      console.error('Webhook: subscription.updated - subscription not found', {
        subscriptionId: subscription.id,
      })
      return
    }
    await db
      .update(schema.subscriptions)
      .set({
        stripePriceId: subscription.items.data[0]?.price.id,
        status: subscription.status,
        plan: subscription.items.data[0]?.price.nickname ?? null,
        currentPeriodStart: periodDates.currentPeriodStart,
        currentPeriodEnd: periodDates.currentPeriodEnd,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        updatedAt: new Date(),
      })
      .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
    console.log('Subscription updated', {
      organizationId: existingSubscription[0].organizationId,
      subscriptionId: subscription.id,
      status: subscription.status,
    })
    return
  }
  await db
    .update(schema.subscriptions)
    .set({
      stripePriceId: subscription.items.data[0]?.price.id,
      status: subscription.status,
      plan: subscription.items.data[0]?.price.nickname ?? null,
      currentPeriodStart: periodDates.currentPeriodStart,
      currentPeriodEnd: periodDates.currentPeriodEnd,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.organizationId, organizationId))
  console.log('Subscription updated', {
    organizationId,
    subscriptionId: subscription.id,
    status: subscription.status,
  })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const existingSubscription = await db
    .select({ organizationId: schema.subscriptions.organizationId })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
    .limit(1)
  if (existingSubscription.length === 0) {
    console.error('Webhook: subscription.deleted - subscription not found', {
      subscriptionId: subscription.id,
    })
    return
  }
  await db
    .update(schema.subscriptions)
    .set({
      status: 'canceled',
      cancelAtPeriodEnd: false,
      updatedAt: new Date(),
    })
    .where(eq(schema.subscriptions.stripeSubscriptionId, subscription.id))
  console.log('Subscription canceled', {
    organizationId: existingSubscription[0].organizationId,
    subscriptionId: subscription.id,
  })
}

export const webhookRouter = Router()

webhookRouter.post('/webhook', raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['stripe-signature']
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({
        error: { message: 'Missing Stripe signature', code: 'MISSING_SIGNATURE' },
      })
    }
    const result = verifyWebhookSignature(stripe, req.body, signature, serverEnv.stripeWebhookSecret)
    if (!result.success) {
      console.error('Webhook signature verification failed', {
        error: result.error.message,
      })
      return res.status(400).json({
        error: { message: 'Invalid signature', code: 'INVALID_SIGNATURE' },
      })
    }
    const event = result.data
    console.log('Webhook received', { eventType: event.type, eventId: event.id })
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      default:
        console.log('Unhandled webhook event', { eventType: event.type })
    }
    return res.status(200).json({ received: true })
  } catch (error) {
    console.error('Webhook processing error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
})

export const billingRoutes = router
