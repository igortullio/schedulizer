import { Alert, AlertDescription, Button, Card, CardContent, Input, Label } from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useSubscriptionContext } from '@/contexts/subscription-context'
import {
  BillingHistoryTable,
  CancelSubscriptionDialog,
  DowngradeValidationDialog,
  PaymentMethodCard,
  PlanLimitBanner,
  SubscriptionCard,
  UpdatePlanDialog,
  UsageIndicator,
  useBillingHistory,
  useCustomerPortal,
  useSubscription,
  useValidateDowngrade,
} from '@/features/billing'
import { useOrganizationSettings } from '@/features/settings'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MIN_SLUG_LENGTH = 3
const MAX_SLUG_LENGTH = 100

export function Component() {
  const { t } = useTranslation('settings')
  const navigate = useNavigate()
  const { usage } = useSubscriptionContext()
  const { settings, state: settingsState, updateSettings } = useOrganizationSettings()
  const { subscription, state: subscriptionState } = useSubscription()
  const { invoices, state: invoicesState, error: invoicesError, refetch: refetchInvoices } = useBillingHistory()
  const { state: portalState, openPortal } = useCustomerPortal()
  const [slug, setSlug] = useState('')
  const [timezone, setTimezone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false)
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false)
  const [isDowngradeDialogOpen, setIsDowngradeDialogOpen] = useState(false)
  const {
    validation: downgradeValidation,
    state: downgradeState,
    error: downgradeError,
    validateDowngrade,
    reset: resetDowngrade,
  } = useValidateDowngrade()
  const isPortalLoading = portalState === 'loading'
  const isSubscriptionLoading = subscriptionState === 'loading'
  const isInvoicesLoading = invoicesState === 'loading'
  useEffect(() => {
    if (settings) {
      setSlug(settings.slug)
      setTimezone(settings.timezone)
    }
  }, [settings])
  function handleSlugChange(value: string) {
    setSlug(value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    setSuccessMessage(null)
    if (!slug.trim() || slug.length < MIN_SLUG_LENGTH || slug.length > MAX_SLUG_LENGTH) {
      setFormError(t('form.errors.slugLength'))
      return
    }
    if (!SLUG_REGEX.test(slug)) {
      setFormError(t('form.errors.slugInvalid'))
      return
    }
    if (!timezone.trim()) {
      setFormError(t('form.errors.timezoneRequired'))
      return
    }
    setIsSubmitting(true)
    try {
      await updateSettings({ slug, timezone })
      setSuccessMessage(t('form.success'))
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('form.errors.updateFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }
  function handleManageSubscription() {
    if (!subscription?.stripeSubscriptionId) {
      navigate('/pricing')
      return
    }
    setIsUpdateDialogOpen(true)
  }
  async function handleUpdatePlanConfirm() {
    setIsUpdateDialogOpen(false)
    if (subscription?.plan === 'professional') {
      resetDowngrade()
      setIsDowngradeDialogOpen(true)
      await validateDowngrade('essential')
      return
    }
    openPortal()
  }
  function handleDowngradeConfirm() {
    setIsDowngradeDialogOpen(false)
    openPortal()
  }
  function handleDowngradeClose() {
    setIsDowngradeDialogOpen(false)
    resetDowngrade()
  }
  async function handleDowngradeRetry() {
    resetDowngrade()
    await validateDowngrade('essential')
  }
  function handleCancelSubscription() {
    setIsCancelDialogOpen(true)
  }
  function handleCancelSubscriptionConfirm() {
    setIsCancelDialogOpen(false)
    openPortal()
  }
  function handleManagePayment() {
    openPortal()
  }
  if (settingsState === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
        <p className="mt-2 text-muted-foreground">{t('description')}</p>
      </div>
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">{t('sections.organization')}</h2>
          {usage?.members ? (
            <div className="mb-4 space-y-3">
              <div className="w-48">
                <UsageIndicator resource="members" usage={usage.members} />
              </div>
              {!usage.members.canAdd && usage.members.limit !== null ? (
                <PlanLimitBanner resource="members" current={usage.members.current} limit={usage.members.limit} />
              ) : null}
            </div>
          ) : null}
          <Card>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4" data-testid="settings-form">
                {formError ? (
                  <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
                    <AlertDescription>{formError}</AlertDescription>
                  </Alert>
                ) : null}
                {successMessage ? (
                  <Alert
                    className="border-0 bg-green-500/10 text-green-700 dark:text-green-400"
                    data-testid="form-success"
                  >
                    <AlertDescription>{successMessage}</AlertDescription>
                  </Alert>
                ) : null}
                <div className="space-y-2">
                  <Label htmlFor="slug">{t('form.slug')}</Label>
                  <div className="flex items-center">
                    <span className="rounded-l-md border border-r-0 border-input bg-muted px-3 py-2 text-sm text-muted-foreground">
                      /booking/
                    </span>
                    <Input
                      id="slug"
                      value={slug}
                      onChange={e => handleSlugChange(e.target.value)}
                      placeholder={t('form.slugPlaceholder')}
                      required
                      className="rounded-l-none"
                      data-testid="slug-input"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">{t('form.slugHelp')}</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">{t('form.timezone')}</Label>
                  <Input
                    id="timezone"
                    value={timezone}
                    onChange={e => setTimezone(e.target.value)}
                    placeholder="America/Sao_Paulo"
                    required
                    data-testid="timezone-input"
                  />
                  <p className="text-xs text-muted-foreground">{t('form.timezoneHelp')}</p>
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="submit-button">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      <span>{t('form.saving')}</span>
                    </>
                  ) : (
                    t('form.save')
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">{t('sections.subscription')}</h2>
          {isSubscriptionLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : (
            <>
              <div className="grid gap-6 md:grid-cols-2">
                <SubscriptionCard
                  subscription={subscription}
                  isLoading={isSubscriptionLoading}
                  onManageSubscription={handleManageSubscription}
                  isPortalLoading={isPortalLoading}
                  onCancelSubscription={handleCancelSubscription}
                />
                <PaymentMethodCard
                  onManagePayment={handleManagePayment}
                  isLoading={isSubscriptionLoading}
                  isPortalLoading={isPortalLoading}
                />
              </div>
              <div className="mt-8">
                <BillingHistoryTable
                  invoices={invoices}
                  isLoading={isInvoicesLoading}
                  error={invoicesError}
                  onRetry={refetchInvoices}
                />
              </div>
            </>
          )}
        </div>
      </div>
      <UpdatePlanDialog
        isOpen={isUpdateDialogOpen}
        onClose={() => setIsUpdateDialogOpen(false)}
        onConfirm={handleUpdatePlanConfirm}
        isLoading={isPortalLoading}
      />
      <CancelSubscriptionDialog
        isOpen={isCancelDialogOpen}
        onClose={() => setIsCancelDialogOpen(false)}
        onConfirm={handleCancelSubscriptionConfirm}
        isLoading={isPortalLoading}
        periodEnd={subscription?.currentPeriodEnd ?? null}
      />
      <DowngradeValidationDialog
        isOpen={isDowngradeDialogOpen}
        onClose={handleDowngradeClose}
        onConfirm={handleDowngradeConfirm}
        onRetry={handleDowngradeRetry}
        isLoading={isPortalLoading}
        isValidating={downgradeState === 'loading'}
        validation={downgradeValidation}
        error={downgradeError}
      />
    </div>
  )
}

export default Component
