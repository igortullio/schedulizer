import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useOrganizationSettings } from '@/features/settings'

const SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MIN_SLUG_LENGTH = 3
const MAX_SLUG_LENGTH = 100

export function Component() {
  const { t } = useTranslation('settings')
  const { settings, state, updateSettings } = useOrganizationSettings()
  const [slug, setSlug] = useState('')
  const [timezone, setTimezone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
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
  if (state === 'loading') {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className="mx-auto max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="settings-form">
            {formError ? (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="form-error">
                {formError}
              </div>
            ) : null}
            {successMessage ? (
              <div
                className="rounded-md bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-400"
                data-testid="form-success"
              >
                {successMessage}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="slug">{t('form.slug')}</Label>
              <Input
                id="slug"
                value={slug}
                onChange={e => handleSlugChange(e.target.value)}
                placeholder={t('form.slugPlaceholder')}
                required
                data-testid="slug-input"
              />
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
  )
}

export default Component
