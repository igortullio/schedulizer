import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@igortullio-ui/react'
import { ChevronLeft, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { BookingService } from '../hooks/use-booking-page'
import type { TimeSlot } from '../hooks/use-slots'

const MIN_PHONE_LENGTH = 8
const MAX_PHONE_LENGTH = 50

interface BookingFormProps {
  service: BookingService
  slot: TimeSlot
  isSubmitting: boolean
  error: string | null
  onSubmit: (data: { customerName: string; customerEmail: string; customerPhone: string }) => void
  onBack: () => void
}

export function BookingForm({ service, slot, isSubmitting, error, onSubmit, onBack }: BookingFormProps) {
  const { t, i18n } = useTranslation('booking')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [formError, setFormError] = useState<string | null>(null)
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!customerName.trim()) {
      setFormError(t('form.errors.nameRequired'))
      return
    }
    if (!customerEmail.trim() || !isValidEmail(customerEmail)) {
      setFormError(t('form.errors.emailInvalid'))
      return
    }
    if (
      !customerPhone.trim() ||
      customerPhone.trim().length < MIN_PHONE_LENGTH ||
      customerPhone.trim().length > MAX_PHONE_LENGTH
    ) {
      setFormError(t('form.errors.phoneInvalid'))
      return
    }
    onSubmit({
      customerName: customerName.trim(),
      customerEmail: customerEmail.trim(),
      customerPhone: customerPhone.trim(),
    })
  }
  const displayError = formError ?? error
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US'
  const slotDate = new Date(slot.startTime)
  const slotEndDate = new Date(slot.endTime)
  return (
    <div data-testid="booking-form-container">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-to-slots">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('form.back')}
        </Button>
      </div>
      <Card className="mb-4">
        <CardContent className="pt-4">
          <div className="text-sm text-muted-foreground">
            <p className="font-medium text-foreground">{service.name}</p>
            <p>
              {slotDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
            <p>
              {slotDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              {' - '}
              {slotEndDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('form.title')}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4" data-testid="booking-form">
            {displayError ? (
              <div
                className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
                role="alert"
                data-testid="form-error"
              >
                {displayError}
              </div>
            ) : null}
            <div className="space-y-2">
              <Label htmlFor="customerName">{t('form.name')}</Label>
              <Input
                id="customerName"
                value={customerName}
                onChange={e => setCustomerName(e.target.value)}
                placeholder={t('form.namePlaceholder')}
                required
                data-testid="customer-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerEmail">{t('form.email')}</Label>
              <Input
                id="customerEmail"
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder={t('form.emailPlaceholder')}
                required
                data-testid="customer-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone">{t('form.phone')}</Label>
              <Input
                id="customerPhone"
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder={t('form.phonePlaceholder')}
                required
                data-testid="customer-phone-input"
              />
            </div>
            <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="submit-booking">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span>{t('form.submitting')}</span>
                </>
              ) : (
                t('form.submit')
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
