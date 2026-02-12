import { Check } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { PricingCard } from './pricing-card'
import type { BillingFrequency } from './pricing-data'
import { PLANS } from './pricing-data'
import { PricingToggle } from './pricing-toggle'

export function PricingSection() {
  const { t } = useTranslation()
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly')
  return (
    <section className="px-4 py-20 md:py-28" aria-labelledby="pricing-title">
      <div className="mx-auto max-w-5xl">
        <div className="mb-12 text-center">
          <h2 id="pricing-title" className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t('pricing.title')} <span className="gradient-text">{t('pricing.titleHighlight')}</span>
          </h2>
          <p className="mb-8 text-lg text-muted-foreground">{t('pricing.subtitle')}</p>
          <PricingToggle frequency={frequency} onFrequencyChange={setFrequency} />
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {PLANS.map(plan => (
            <PricingCard key={plan.planId} plan={plan} frequency={frequency} />
          ))}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>{t('pricing.trustBadges.noSetupFee')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>{t('pricing.trustBadges.cancelAnytime')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>{t('pricing.trustBadges.freeTrial')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
