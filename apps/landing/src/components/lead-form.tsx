import { clientEnv } from '@schedulizer/env/client'
import type { CreateLeadRequest } from '@schedulizer/shared-types'
import { Button, Input } from '@schedulizer/ui'
import { Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { z } from 'zod'
import { ConfirmationModal } from './confirmation-modal'

interface LeadFormProps {
  onSuccess?: () => void
  defaultPlanInterest?: 'essential' | 'professional'
}

export function LeadForm({ onSuccess, defaultPlanInterest }: LeadFormProps) {
  const { t } = useTranslation()
  const [formData, setFormData] = useState<CreateLeadRequest>({
    name: '',
    email: '',
    phone: '',
    planInterest: defaultPlanInterest || 'essential',
  })
  const [isLoading, setIsLoading] = useState(false)
  useEffect(() => {
    if (defaultPlanInterest) {
      setFormData(prev => ({ ...prev, planInterest: defaultPlanInterest }))
    }
  }, [defaultPlanInterest])
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const createLeadSchema = z.object({
    name: z.string().min(1, t('leadForm.validation.nameRequired')),
    email: z.email(t('leadForm.validation.invalidEmail')),
    phone: z
      .string()
      .min(1, t('leadForm.validation.phoneRequired'))
      .regex(/^\+?[\d\s\-()]+$/, t('leadForm.validation.invalidPhoneFormat')),
    planInterest: z.enum(['essential', 'professional'], {
      message: t('leadForm.validation.invalidPlan'),
    }),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setFieldErrors({})

    const result = createLeadSchema.safeParse(formData)
    if (!result.success) {
      const errors: Record<string, string> = {}
      for (const issue of result.error.issues) {
        const path = issue.path[0] as string
        errors[path] = issue.message
      }
      setFieldErrors(errors)
      return
    }

    setIsLoading(true)

    const submitWithRetry = async (retries = 3): Promise<void> => {
      try {
        const response = await fetch(`${clientEnv.apiUrl}/api/leads`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: t('leadForm.errors.submitError') }))
          throw new Error(errorData.error || t('leadForm.errors.submitError'))
        }

        await response.json()

        setFormData({
          name: '',
          email: '',
          phone: '',
          planInterest: defaultPlanInterest || 'essential',
        })

        setShowConfirmationModal(true)
        onSuccess?.()
      } catch (err) {
        if (retries > 0 && err instanceof TypeError) {
          await new Promise(resolve => setTimeout(resolve, 1000))
          return submitWithRetry(retries - 1)
        }
        throw err
      }
    }

    try {
      await submitWithRetry()
    } catch (err) {
      setError(err instanceof Error ? err.message : t('leadForm.errors.genericError'))
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    if (fieldErrors[name]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  return (
    <>
      <section className="px-4 py-20 md:py-28" id="lead-form">
        <div className="mx-auto max-w-xl">
          <div className="mb-12 text-center">
            <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              {t('leadForm.title')}{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                {t('leadForm.titleHighlight')}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground">{t('leadForm.subtitle')}</p>
          </div>

          <div className="glass rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                  {t('leadForm.labels.name')}
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder={t('leadForm.placeholders.name')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-background/50 transition-all duration-200 focus:bg-background"
                  aria-invalid={!!fieldErrors.name}
                  aria-describedby={fieldErrors.name ? 'name-error' : undefined}
                />
                {fieldErrors.name && (
                  <p id="name-error" className="mt-2 text-sm text-destructive">
                    {fieldErrors.name}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-foreground">
                  {t('leadForm.labels.email')}
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder={t('leadForm.placeholders.email')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-background/50 transition-all duration-200 focus:bg-background"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="mt-2 text-sm text-destructive">
                    {fieldErrors.email}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="mb-2 block text-sm font-medium text-foreground">
                  {t('leadForm.labels.phone')}
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder={t('leadForm.placeholders.phone')}
                  disabled={isLoading}
                  className="h-12 rounded-xl border-border/50 bg-background/50 transition-all duration-200 focus:bg-background"
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
                {fieldErrors.phone && (
                  <p id="phone-error" className="mt-2 text-sm text-destructive">
                    {fieldErrors.phone}
                  </p>
                )}
              </div>

              <div>
                <label htmlFor="planInterest" className="mb-2 block text-sm font-medium text-foreground">
                  {t('leadForm.labels.planInterest')}
                </label>
                <select
                  id="planInterest"
                  name="planInterest"
                  value={formData.planInterest}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="flex h-12 w-full cursor-pointer rounded-xl border border-border/50 bg-background/50 px-4 py-2 text-sm transition-all duration-200 focus:bg-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                  aria-invalid={!!fieldErrors.planInterest}
                  aria-describedby={fieldErrors.planInterest ? 'planInterest-error' : undefined}
                >
                  <option value="essential">{t('leadForm.options.essential')}</option>
                  <option value="professional">{t('leadForm.options.professional')}</option>
                </select>
                {fieldErrors.planInterest && (
                  <p id="planInterest-error" className="mt-2 text-sm text-destructive">
                    {fieldErrors.planInterest}
                  </p>
                )}
              </div>

              {error && (
                <div className="rounded-xl bg-destructive/10 p-4 text-sm text-destructive" role="alert">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="gradient-accent h-14 w-full cursor-pointer rounded-xl border-0 text-base font-semibold text-white shadow-lg transition-all duration-200 hover:scale-[1.02] hover:shadow-xl disabled:opacity-50"
                size="lg"
                disabled={isLoading}
              >
                {isLoading ? (
                  t('leadForm.buttons.submitting')
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-5 w-5" />
                    {t('leadForm.buttons.submit')}
                  </span>
                )}
              </Button>
            </form>
          </div>
        </div>
      </section>

      <ConfirmationModal open={showConfirmationModal} onClose={() => setShowConfirmationModal(false)} />
    </>
  )
}
