import { type ResolvedPlan, resolvePlanFromSubscription } from '@schedulizer/billing'
import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { getPlanLimits } from '@schedulizer/shared-types'
import { fromNodeHeaders } from 'better-auth/node'
import { eq } from 'drizzle-orm'
import type { NextFunction, Request, Response } from 'express'
import { auth } from '../lib/auth'

const db = createDb(serverEnv.databaseUrl)

const VALID_SUBSCRIPTION_STATUSES = ['active', 'trialing'] as const

type ValidSubscriptionStatus = (typeof VALID_SUBSCRIPTION_STATUSES)[number]

export interface SubscriptionData {
  id: string
  status: string
  plan: ResolvedPlan
  organizationId: string
  stripeSubscriptionId: string | null
}

declare global {
  namespace Express {
    interface Request {
      subscription?: SubscriptionData
    }
  }
}

function isValidSubscriptionStatus(status: string | null): status is ValidSubscriptionStatus {
  if (!status) return false
  return VALID_SUBSCRIPTION_STATUSES.includes(status as ValidSubscriptionStatus)
}

function isSubscriptionExpired(currentPeriodEnd: Date | null): boolean {
  if (!currentPeriodEnd) return true
  return new Date() > currentPeriodEnd
}

async function getSubscriptionByOrganizationId(organizationId: string) {
  const subscriptions = await db
    .select({
      id: schema.subscriptions.id,
      status: schema.subscriptions.status,
      stripePriceId: schema.subscriptions.stripePriceId,
      stripeSubscriptionId: schema.subscriptions.stripeSubscriptionId,
      currentPeriodEnd: schema.subscriptions.currentPeriodEnd,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.organizationId, organizationId))
    .limit(1)
  return subscriptions[0] ?? null
}

export async function requireSubscription(req: Request, res: Response, next: NextFunction) {
  try {
    const session = await auth.api.getSession({
      headers: fromNodeHeaders(req.headers),
    })
    if (!session) {
      return res.status(401).json({
        error: { message: 'Unauthorized', code: 'UNAUTHORIZED' },
      })
    }
    const organizationId = session.session.activeOrganizationId
    if (!organizationId) {
      return res.status(401).json({
        error: { message: 'No active organization', code: 'NO_ACTIVE_ORG' },
      })
    }
    const subscription = await getSubscriptionByOrganizationId(organizationId)
    if (!subscription) {
      return res.status(403).json({
        error: { message: 'No active subscription', code: 'NO_SUBSCRIPTION' },
      })
    }
    if (!isValidSubscriptionStatus(subscription.status)) {
      return res.status(403).json({
        error: { message: 'Subscription is not active', code: 'SUBSCRIPTION_INACTIVE' },
      })
    }
    if (isSubscriptionExpired(subscription.currentPeriodEnd)) {
      return res.status(403).json({
        error: { message: 'Subscription has expired', code: 'SUBSCRIPTION_EXPIRED' },
      })
    }
    let resolvedPlan = resolvePlanFromSubscription({
      stripePriceId: subscription.stripePriceId,
      status: subscription.status,
    })
    if (!resolvedPlan) {
      console.error('Failed to resolve plan type from stripePriceId', {
        organizationId,
        stripePriceId: subscription.stripePriceId,
        fallback: 'essential',
      })
      resolvedPlan = {
        type: 'essential',
        limits: getPlanLimits('essential'),
        stripePriceId: subscription.stripePriceId ?? '',
      }
    }
    req.subscription = {
      id: subscription.id,
      status: subscription.status,
      plan: resolvedPlan,
      organizationId,
      stripeSubscriptionId: subscription.stripeSubscriptionId,
    }
    return next()
  } catch (error) {
    console.error('Subscription middleware error', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    return res.status(500).json({
      error: { message: 'Internal server error', code: 'INTERNAL_ERROR' },
    })
  }
}
