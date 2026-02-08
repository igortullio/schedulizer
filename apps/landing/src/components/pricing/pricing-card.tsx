import { Button } from '@schedulizer/ui'
import { Check, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BillingFrequency, PlanConfig, PlanId } from './pricing-data'
import { formatPrice, getMonthlyEquivalent, PRICING_CONFIG } from './pricing-data'

interface PricingCardProps {
  plan: PlanConfig
  frequency: BillingFrequency
  onSelect: (planId: PlanId) => void
}

export function PricingCard({ plan, frequency, onSelect }: PricingCardProps) {
  const { t, i18n } = useTranslation()
  const locale = PRICING_CONFIG.locale[i18n.language as keyof typeof PRICING_CONFIG.locale] || 'pt-BR'
  const currency = PRICING_CONFIG.currency[i18n.language as keyof typeof PRICING_CONFIG.currency] || 'BRL'
  const isYearly = frequency === 'yearly'
  const price = isYearly ? getMonthlyEquivalent(plan.pricing.yearly) : plan.pricing.monthly
  const formattedPrice = formatPrice(price, locale, currency)
  const planData = t(`pricing.plans.${plan.planId}`, { returnObjects: true }) as {
    name: string
    features: string[]
  }
  return (
    <article
      className={`glass hover-lift relative flex cursor-pointer flex-col rounded-3xl p-8 transition-all duration-300 ${
        plan.recommended ? 'ring-2 ring-accent shadow-xl shadow-accent/10' : ''
      }`}
      aria-labelledby={`plan-${plan.planId}-title`}
    >
      {plan.recommended && (
        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
          <span className="gradient-accent inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
            <Star className="h-4 w-4" aria-hidden="true" />
            {t('pricing.badge')}
          </span>
        </div>
      )}
      <div className="mb-8 text-center">
        <h3 id={`plan-${plan.planId}-title`} className="mb-2 text-2xl font-bold text-foreground">
          {planData.name}
        </h3>
        <div className="flex items-baseline justify-center gap-1">
          <span className="text-5xl font-bold text-foreground">{formattedPrice}</span>
          <span className="text-muted-foreground">{t(`pricing.period.${frequency}`)}</span>
        </div>
        {isYearly && (
          <p className="mt-2 text-sm text-muted-foreground">
            {t('pricing.billedAnnually', {
              total: formatPrice(plan.pricing.yearly, locale, currency),
            })}
          </p>
        )}
      </div>
      <ul className="mb-8 flex-1 space-y-4" aria-label={t('pricing.featuresLabel')}>
        {planData.features.map(feature => (
          <li key={feature} className="flex items-start gap-3">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Check className="h-4 w-4 text-primary" aria-hidden="true" />
            </div>
            <span className="text-muted-foreground">{feature}</span>
          </li>
        ))}
      </ul>
      <Button
        className={`w-full cursor-pointer py-6 text-base font-semibold transition-all duration-200 hover:scale-[1.02] ${
          plan.recommended
            ? 'gradient-accent border-0 text-white shadow-lg hover:shadow-xl'
            : 'bg-primary/5 text-primary hover:bg-primary/10'
        }`}
        size="lg"
        variant={plan.recommended ? 'default' : 'outline'}
        onClick={() => onSelect(plan.planId)}
        aria-label={t('pricing.ctaAriaLabel', { plan: planData.name })}
      >
        {t('pricing.cta')}
      </Button>
    </article>
  )
}
