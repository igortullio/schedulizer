import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schedulizer/ui'
import { Check, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CheckoutButton } from '@/components/checkout'
import { useSession } from '@/lib/auth-client'

type BillingFrequency = 'monthly' | 'yearly'

interface PlanFeature {
  text: string
  included: boolean
}

interface Plan {
  id: string
  name: string
  description: string
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
    name: 'Essential',
    description: 'Perfect for small businesses getting started',
    monthlyPrice: 49.9,
    yearlyPrice: 49.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    priceIds: {
      monthly: 'price_essential_monthly',
      yearly: 'price_essential_yearly',
    },
    features: [
      { text: 'Up to 5 team members', included: true },
      { text: 'Basic scheduling', included: true },
      { text: 'Email notifications', included: true },
      { text: 'Customer support', included: true },
      { text: 'Advanced analytics', included: false },
      { text: 'API access', included: false },
    ],
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'For growing teams that need more power',
    monthlyPrice: 99.9,
    yearlyPrice: 99.9 * 12 * (1 - ANNUAL_DISCOUNT_PERCENT / 100),
    priceIds: {
      monthly: 'price_professional_monthly',
      yearly: 'price_professional_yearly',
    },
    features: [
      { text: 'Unlimited team members', included: true },
      { text: 'Advanced scheduling', included: true },
      { text: 'Email & SMS notifications', included: true },
      { text: 'Priority support', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'API access', included: true },
    ],
    recommended: true,
  },
]

function formatPrice(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

function getMonthlyEquivalent(yearlyPrice: number): number {
  return yearlyPrice / 12
}

export function Component() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const [frequency, setFrequency] = useState<BillingFrequency>('monthly')
  const isYearly = frequency === 'yearly'
  function handleBackToDashboard() {
    navigate('/dashboard')
  }
  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (!session) {
    navigate('/auth/login', { replace: true })
    return null
  }
  return (
    <div className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-4">
          <Button variant="ghost" onClick={handleBackToDashboard} data-testid="back-button">
            &larr; Back to Dashboard
          </Button>
        </div>
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">Choose your plan</h1>
          <p className="mb-8 text-lg text-muted-foreground">Start your 14-day free trial. No credit card required.</p>
          <div className="inline-flex items-center rounded-lg bg-muted p-1">
            <label
              className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                frequency === 'monthly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="monthly-toggle"
            >
              <input
                type="radio"
                name="billing-frequency"
                value="monthly"
                checked={frequency === 'monthly'}
                onChange={() => setFrequency('monthly')}
                className="sr-only"
              />
              Monthly
            </label>
            <label
              className={`cursor-pointer rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                frequency === 'yearly'
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              data-testid="yearly-toggle"
            >
              <input
                type="radio"
                name="billing-frequency"
                value="yearly"
                checked={frequency === 'yearly'}
                onChange={() => setFrequency('yearly')}
                className="sr-only"
              />
              Yearly
              <span className="ml-2 rounded-full bg-green-100 px-2 py-0.5 text-xs text-green-700">
                Save {ANNUAL_DISCOUNT_PERCENT}%
              </span>
            </label>
          </div>
        </div>
        <div className="grid gap-8 md:grid-cols-2">
          {PLANS.map(plan => {
            const price = isYearly ? plan.yearlyPrice : plan.monthlyPrice
            const monthlyEquivalent = isYearly ? getMonthlyEquivalent(plan.yearlyPrice) : plan.monthlyPrice
            const priceId = isYearly ? plan.priceIds.yearly : plan.priceIds.monthly
            return (
              <Card
                key={plan.id}
                className={`relative ${plan.recommended ? 'border-primary shadow-lg' : ''}`}
                data-testid={`plan-card-${plan.id}`}
              >
                {plan.recommended ? (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Recommended
                    </span>
                  </div>
                ) : null}
                <CardHeader className="text-center">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-foreground">{formatPrice(monthlyEquivalent)}</span>
                    <span className="text-muted-foreground">/month</span>
                    {isYearly ? (
                      <p className="mt-1 text-sm text-muted-foreground">{formatPrice(price)} billed yearly</p>
                    ) : null}
                  </div>
                </CardHeader>
                <CardContent>
                  <ul className="mb-6 space-y-3">
                    {plan.features.map(feature => (
                      <li
                        key={feature.text}
                        className={`flex items-center gap-2 ${
                          feature.included ? 'text-foreground' : 'text-muted-foreground line-through'
                        }`}
                      >
                        <Check
                          className={`h-4 w-4 ${feature.included ? 'text-primary' : 'text-muted-foreground'}`}
                          aria-hidden="true"
                        />
                        {feature.text}
                      </li>
                    ))}
                  </ul>
                  <CheckoutButton
                    priceId={priceId}
                    planName={plan.name}
                    className="w-full"
                    variant={plan.recommended ? 'default' : 'outline'}
                    data-testid={`checkout-button-${plan.id}`}
                  >
                    Get Started
                  </CheckoutButton>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <div className="mt-12 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>No setup fees</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>Cancel anytime</span>
          </div>
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 text-primary" aria-hidden="true" />
            <span>14-day free trial</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Component
