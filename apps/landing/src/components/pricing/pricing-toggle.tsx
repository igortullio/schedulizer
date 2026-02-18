import { useTranslation } from 'react-i18next'
import type { BillingFrequency } from './pricing-data'
import { PRICING_CONFIG } from './pricing-data'

interface PricingToggleProps {
  frequency: BillingFrequency
  onFrequencyChange: (frequency: BillingFrequency) => void
}

export function PricingToggle({ frequency, onFrequencyChange }: PricingToggleProps) {
  const { t } = useTranslation()
  const isYearly = frequency === 'yearly'
  return (
    <fieldset className="inline-flex items-center rounded-full bg-muted p-1" aria-label={t('pricing.toggle.ariaLabel')}>
      <legend className="sr-only">{t('pricing.toggle.ariaLabel')}</legend>
      <label
        className={`cursor-pointer rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
          !isYearly ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <input
          type="radio"
          name="billing-frequency"
          value="monthly"
          checked={!isYearly}
          onChange={() => onFrequencyChange('monthly')}
          className="sr-only"
        />
        {t('pricing.toggle.monthly')}
      </label>
      <label
        className={`cursor-pointer rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
          isYearly ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'
        }`}
      >
        <input
          type="radio"
          name="billing-frequency"
          value="yearly"
          checked={isYearly}
          onChange={() => onFrequencyChange('yearly')}
          className="sr-only"
        />
        {t('pricing.toggle.yearly')}
        <span className="ml-2 inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t('pricing.toggle.savings', { percent: PRICING_CONFIG.annualDiscountPercent })}
        </span>
      </label>
    </fieldset>
  )
}
