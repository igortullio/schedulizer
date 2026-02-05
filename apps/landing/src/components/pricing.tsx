import { Button } from '@schedulizer/ui'
import { Check, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface PricingPlan {
  planId: 'essential' | 'professional'
  recommended?: boolean
}

const planConfigs: PricingPlan[] = [
  {
    planId: 'essential',
  },
  {
    planId: 'professional',
    recommended: true,
  },
]

interface PricingProps {
  onPlanSelect?: (planId: 'essential' | 'professional') => void
}

export function Pricing({ onPlanSelect }: PricingProps) {
  const { t } = useTranslation()
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-5xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t('pricing.title')}{' '}
            <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              {t('pricing.titleHighlight')}
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {planConfigs.map(plan => {
            const planData = t(`pricing.plans.${plan.planId}`, {
              returnObjects: true,
            }) as {
              name: string
              price: string
              period: string
              features: string[]
            }
            return (
              <div
                key={plan.planId}
                className={`glass hover-lift relative cursor-pointer rounded-3xl p-8 transition-all duration-300 ${
                  plan.recommended ? 'ring-2 ring-accent shadow-xl shadow-accent/10' : ''
                }`}
              >
                {plan.recommended && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <span className="gradient-accent inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold text-white shadow-lg">
                      <Star className="h-4 w-4" />
                      {t('pricing.badge')}
                    </span>
                  </div>
                )}

                <div className="mb-8 text-center">
                  <h3 className="mb-2 text-2xl font-bold text-foreground">{planData.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-5xl font-bold text-foreground">{planData.price}</span>
                    <span className="text-muted-foreground">{planData.period}</span>
                  </div>
                </div>

                <ul className="mb-8 space-y-4">
                  {planData.features.map(feature => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                        <Check className="h-4 w-4 text-primary" />
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
                  onClick={() => onPlanSelect?.(plan.planId)}
                >
                  {t('pricing.cta')}
                </Button>
              </div>
            )
          })}
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <span>{t('pricing.trustBadges.noSetupFee')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <span>{t('pricing.trustBadges.cancelAnytime')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" />
            <span>{t('pricing.trustBadges.freeTrial')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
