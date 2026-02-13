import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@igortullio-ui/react'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { useServices } from '@/features/services'
import { useSession } from '@/lib/auth-client'

const MIN_DURATION = 5
const MAX_DURATION = 480

export function Component() {
  const { t } = useTranslation('services')
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { createService } = useServices()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [price, setPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  function handleBack() {
    navigate('/services')
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    const durationNum = Number.parseInt(duration, 10)
    if (!name.trim()) {
      setFormError(t('form.errors.nameRequired'))
      return
    }
    if (Number.isNaN(durationNum) || durationNum < MIN_DURATION || durationNum > MAX_DURATION) {
      setFormError(t('form.errors.durationInvalid'))
      return
    }
    if (!price.trim() || !/^\d+\.\d{2}$/.test(price)) {
      setFormError(t('form.errors.priceInvalid'))
      return
    }
    setIsSubmitting(true)
    try {
      await createService({
        name: name.trim(),
        description: description.trim() || undefined,
        duration: durationNum,
        price,
      })
      navigate('/services')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('form.errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }
  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} data-testid="back-button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToServices')}
          </Button>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{t('form.createTitle')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="service-form">
              {formError ? (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="form-error">
                  {formError}
                </div>
              ) : null}
              <div className="space-y-2">
                <Label htmlFor="name">{t('form.name')}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder={t('form.namePlaceholder')}
                  required
                  data-testid="name-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">{t('form.description')}</Label>
                <Input
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  placeholder={t('form.descriptionPlaceholder')}
                  data-testid="description-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">{t('form.duration')}</Label>
                <Input
                  id="duration"
                  type="number"
                  min={MIN_DURATION}
                  max={MAX_DURATION}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  placeholder={t('form.durationPlaceholder')}
                  required
                  data-testid="duration-input"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="price">{t('form.price')}</Label>
                <Input
                  id="price"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="50.00"
                  required
                  data-testid="price-input"
                />
              </div>
              <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="submit-button">
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin" aria-hidden="true" />
                    <span>{t('form.creating')}</span>
                  </>
                ) : (
                  t('form.create')
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default Component
