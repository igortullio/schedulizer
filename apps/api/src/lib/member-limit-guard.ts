import { resolvePlanFromSubscription } from '@schedulizer/billing'
import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { getPlanLimits } from '@schedulizer/shared-types'
import { count, eq } from 'drizzle-orm'

const db = createDb(serverEnv.databaseUrl)

interface MemberLimitResult {
  allowed: boolean
  reason?: string
  current?: number
  limit?: number
  planType?: string
}

export async function checkMemberLimit(organizationId: string): Promise<MemberLimitResult> {
  const subscription = await db
    .select({
      stripePriceId: schema.subscriptions.stripePriceId,
      status: schema.subscriptions.status,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.organizationId, organizationId))
    .limit(1)
  const [memberCount] = await db
    .select({ value: count() })
    .from(schema.members)
    .where(eq(schema.members.organizationId, organizationId))
  const currentCount = memberCount?.value ?? 0
  if (subscription.length === 0) {
    if (currentCount === 0) {
      return { allowed: true }
    }
    console.log('Plan limit enforcement triggered', {
      organizationId,
      resource: 'members',
      reason: 'no_subscription',
      action: 'blocked',
    })
    return { allowed: false, reason: 'no_subscription' }
  }
  let resolvedPlan = resolvePlanFromSubscription({
    stripePriceId: subscription[0].stripePriceId,
    status: subscription[0].status,
  })
  if (!resolvedPlan) {
    console.error('Failed to resolve plan type from stripePriceId', {
      organizationId,
      stripePriceId: subscription[0].stripePriceId,
      fallback: 'essential',
    })
    resolvedPlan = {
      type: 'essential',
      limits: getPlanLimits('essential'),
      stripePriceId: subscription[0].stripePriceId ?? '',
    }
  }
  if (currentCount >= resolvedPlan.limits.maxMembers) {
    console.log('Plan limit enforcement triggered', {
      organizationId,
      resource: 'members',
      planType: resolvedPlan.type,
      currentCount,
      limit: resolvedPlan.limits.maxMembers,
      action: 'blocked',
    })
    return {
      allowed: false,
      reason: 'limit_exceeded',
      current: currentCount,
      limit: resolvedPlan.limits.maxMembers,
      planType: resolvedPlan.type,
    }
  }
  return { allowed: true, current: currentCount, limit: resolvedPlan.limits.maxMembers, planType: resolvedPlan.type }
}
