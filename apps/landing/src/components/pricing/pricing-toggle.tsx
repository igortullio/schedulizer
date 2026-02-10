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
    <div className="flex flex-col items-center gap-3">
      <fieldset
        className="relative flex items-center rounded-full bg-muted p-1"
        aria-label={t('pricing.toggle.ariaLabel')}
      >
        <legend className="sr-only">{t('pricing.toggle.ariaLabel')}</legend>
        <label
          className={`relative z-10 cursor-pointer rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
            !isYearly ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
          className={`relative z-10 cursor-pointer rounded-full px-6 py-2 text-sm font-medium transition-all duration-200 ${
            isYearly ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
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
        </label>
        <div
          className={`absolute top-1 h-[calc(100%-8px)] w-[calc(50%-4px)] rounded-full bg-background shadow-sm transition-all duration-200 ${
            isYearly ? 'left-[calc(50%+2px)]' : 'left-1'
          }`}
          aria-hidden="true"
        />
      </fieldset>
      {isYearly && (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t('pricing.toggle.savings', { percent: PRICING_CONFIG.annualDiscountPercent })}
        </span>
      )}
    </div>
  )
}
