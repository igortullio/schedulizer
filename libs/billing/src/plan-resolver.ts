import { serverEnv } from '@schedulizer/env/server'
import { getPlanLimits, type PlanLimits, type PlanType } from '@schedulizer/shared-types'

export interface ResolvedPlan {
  type: PlanType
  limits: PlanLimits
  stripePriceId: string
}

export function resolvePlanType(stripePriceId: string): PlanType | null {
  const essentialPriceIds = [serverEnv.stripePriceEssentialMonthly, serverEnv.stripePriceEssentialYearly]
  const professionalPriceIds = [serverEnv.stripePriceProfessionalMonthly, serverEnv.stripePriceProfessionalYearly]
  if (essentialPriceIds.includes(stripePriceId)) return 'essential'
  if (professionalPriceIds.includes(stripePriceId)) return 'professional'
  return null
}

interface SubscriptionInput {
  stripePriceId: string | null
  status: string
}

export function resolvePlanFromSubscription(subscription: SubscriptionInput): ResolvedPlan | null {
  if (subscription.status === 'trialing') {
    return {
      type: 'professional',
      limits: getPlanLimits('professional'),
      stripePriceId: subscription.stripePriceId ?? '',
    }
  }
  if (!subscription.stripePriceId) return null
  const planType = resolvePlanType(subscription.stripePriceId)
  if (!planType) return null
  return {
    type: planType,
    limits: getPlanLimits(planType),
    stripePriceId: subscription.stripePriceId,
  }
}
