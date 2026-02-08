import type { BillingFrequency, PlanId } from './pricing/pricing-data'
import { PricingSection } from './pricing/pricing-section'

interface PricingProps {
  onPlanSelect?: (planId: PlanId, frequency?: BillingFrequency) => void
}

export function Pricing({ onPlanSelect }: PricingProps) {
  const handlePlanSelect = (planId: PlanId, frequency: BillingFrequency) => {
    onPlanSelect?.(planId, frequency)
  }
  return <PricingSection onPlanSelect={handlePlanSelect} />
}
