import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@igortullio-ui/react'
import { clientEnv } from '@schedulizer/env/client'
import { Check, X } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { CheckoutButton } from '@/components/checkout'
import { formatPrice } from '@/lib/format'

type BillingFrequency = 'monthly' | 'yearly'

interface PlanFeature {
  key: string
  included: boolean
}

interface Plan {
  id: string
  monthlyPrice: number
  yearlyPrice: number
  priceIds: {
    monthly: string
    yearly: string
  }
  features: PlanFeature[]
  recommended?: boolean
}

const ANNUAL_DISCOUNT_PERCENT = 15

const PLANS: Plan[] = [
  {
    id: 'essential',
    monthlyPrice: 49.9,
    yearlyPrice: 49.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    priceIds: {
      monthly: clientEnv.stripePriceEssentialMonthly,
      yearly: clientEnv.stripePriceEssentialYearly,
    },
    features: [
      { key: 'singleMember', included: true },
      { key: 'limitedServices', included: true },
      { key: 'emailNotifications', included: true },
      { key: 'customerSupport', included: true },
      { key: 'advancedAnalytics', included: false },
    ],
  },
  {
    id: 'professional',
    monthlyPrice: 99.9,
    yearlyPrice: 99.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    priceIds: {
      monthly: clientEnv.stripePriceProfessionalMonthly,
      yearly: clientEnv.stripePriceProfessionalYearly,
    },
    features: [
      { key: 'teamMembers', included: true },
      { key: 'unlimitedServices', included: true },
      { key: 'emailWhatsappNotifications', included: true },
      { key: 'prioritySupport', included: true },
      { key: 'advancedAnalytics', included: true },
    ],
    recommended: true,
  },
]

function getMonthlyEquivalent(yearlyPrice: number): number {
  return yearlyPrice / 12
}

function getInitialFrequency(param: string | null): BillingFrequency {
  if (param === 'yearly' || param === 'monthly') return param
  return 'monthly'
}

export function Component() {
  const { t, i18n } = useTranslation('billing')
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const planParam = searchParams.get('plan')
  const frequencyParam = searchParams.get('frequency')
  const [frequency, setFrequency] = useState<BillingFrequency>(getInitialFrequency(frequencyParam))
  const isYearly = frequency === 'yearly'
  function handleBackToDashboard() {
    navigate('/dashboard')
  }
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Button variant="ghost" onClick={handleBackToDashboard} data-testid="back-button">
            &larr; {t('pricing.backToDashboard')}
          </Button>
        </div>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">{t('pricing.title')}</h1>
          <p className="mb-8 text-lg text-muted-foreground">{t('pricing.subtitle')}</p>
          <div
            className="inline-flex items-center rounded-lg bg-muted p-1"
            role="radiogroup"
            aria-label="Billing frequency"
          >
            <Button
              variant="ghost"
              onClick={() => setFrequency('monthly')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                frequency === 'monthly'
                  ? 'bg-background text-foreground shadow-sm hover:bg-background'
                  : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
              }`}
              role="radio"
              aria-checked={frequency === 'monthly'}
              data-testid="monthly-toggle"
            >
              {t('pricing.toggle.monthly')}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setFrequency('yearly')}
              className={`rounded-md px-4 py-2 text-sm font-medium ${
                frequency === 'yearly'
                  ? 'bg-background text-foreground shadow-sm hover:bg-background'
                  : 'text-muted-foreground hover:bg-transparent hover:text-foreground'
              }`}
              role="radio"
              aria-checked={frequency === 'yearly'}
              data-testid="yearly-toggle"
            >
              {t('pricing.toggle.yearly')}
              <Badge variant="success" className="ml-2">
                {t('pricing.toggle.savings', { percent: ANNUAL_DISCOUNT_PERCENT })}
              </Badge>
            </Button>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {PLANS.map(plan => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const monthlyEquivalent = isYearly ? getMonthlyEquivalent(plan.yearlyPrice) : plan.monthlyPrice
            const priceId = isYearly ? plan.priceIds.yearly : plan.priceIds.monthly
            const isHighlighted = planParam === plan.id
            const planName = t(`pricing.plans.${plan.id}.name` as 'pricing.plans.essential.name') as string
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''} ${isHighlighted ? 'ring-2 ring-primary' : ''}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.recommended ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge>{t('pricing.recommended')}</Badge>
                  </div>
                ) : null}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{planName}</CardTitle>
                  <CardDescription>
                    {t(`pricing.plans.${plan.id}.description` as 'pricing.plans.essential.description')}
                  </CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">
                      {formatPrice(monthlyEquivalent, i18n.language)}
                    </span>
                    <span className="text-muted-foreground">{t('pricing.period.monthly')}</span>
                    {isYearly ? (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {t('pricing.billedYearly', { price: formatPrice(price, i18n.language) })}
                      </p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map(feature => (
                      <li
                        key={feature.key}
                        className={`flex items-center gap-2 ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                        }`}
                      >
                        {feature.included ? (
                          <Check className="h-4 w-4 text-primary" aria-hidden="true" />
                        ) : (
                          <X className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
                        )}
                        {t(
                          `pricing.plans.${plan.id}.features.${feature.key}` as 'pricing.plans.essential.features.singleMember',
                        )}
                      </li>
                    ))}
                  </ul>
                  <CheckoutButton
                    priceId={priceId}
                    planName={planName}
                    className="w-full"
                    variant={plan.recommended ? 'default' : 'outline'}
                    data-testid={`checkout-button-${plan.id}`}
                  >
                    {t('pricing.cta')}
                  </CheckoutButton>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>{t('pricing.trustBadges.noSetupFees')}</span>
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
    </div>
  )
}

export default Component
