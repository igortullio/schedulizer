import { clientEnv } from '@schedulizer/env/client'
import type { CreateLeadRequest } from '@schedulizer/shared-types'
import { Button, Input } from '@schedulizer/ui'
import { Send } from 'lucide-react'
import { useState } from 'react'
import { z } from 'zod'
import { ConfirmationModal } from './confirmation-modal'

const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format'),
  planInterest: z.enum(['essential', 'professional'], {
    message: 'Plan must be "essential" or "professional"',
  }),
})

interface LeadFormProps {
  onSuccess?: () => void
  defaultPlanInterest?: 'essential' | 'professional'
}

export function LeadForm({ onSuccess, defaultPlanInterest }: LeadFormProps) {
  const [formData, setFormData] = useState<CreateLeadRequest>({
    name: '',
    email: '',
    phone: '',
    planInterest: defaultPlanInterest || 'essential',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

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
          const errorData = await response.json().catch(() => ({ error: 'Error submitting form' }))
          throw new Error(errorData.error || 'Error submitting form')
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
      setError(err instanceof Error ? err.message : 'Error submitting form. Please try again.')
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
              Get started{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">now</span>
            </h2>
            <p className="text-lg text-muted-foreground">Fill out the form and we will contact you soon</p>
          </div>

          <div className="glass rounded-3xl p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-foreground">
                  Full name
                </label>
                <Input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="John Smith"
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
                  Email
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@email.com"
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
                  Phone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 123-4567"
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
                  Plan of interest
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
                  <option value="essential">Essential - $49.90/month</option>
                  <option value="professional">Professional - $99.90/month</option>
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
                  'Submitting...'
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <Send className="h-5 w-5" />
                    Submit
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
