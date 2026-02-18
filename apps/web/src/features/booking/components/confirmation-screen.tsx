import { Button, Card, CardContent } from '@igortullio-ui/react'
import { clientEnv } from '@schedulizer/env'
import { CalendarCheck, CalendarPlus, Check, Copy } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { BookingService } from '../hooks/use-booking-page'
import type { AppointmentResult } from '../hooks/use-create-appointment'

interface ConfirmationScreenProps {
  service: BookingService
  appointment: AppointmentResult
  slug: string
  customerName: string
  onBookAgain: () => void
}

export function ConfirmationScreen({ service, appointment, slug, customerName, onBookAgain }: ConfirmationScreenProps) {
  const { t, i18n } = useTranslation('booking')
  const navigate = useNavigate()
  const [copied, setCopied] = useState(false)
  const locale = i18n.language === 'pt-BR' ? 'pt-BR' : 'en-US'
  const startDate = new Date(appointment.startDatetime)
  const endDate = new Date(appointment.endDatetime)
  const managementPath = `/booking/${slug}/manage/${appointment.managementToken}`
  const managementUrl = `${clientEnv.webUrl}${managementPath}`
  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(managementUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy management link', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
    }
  }
  return (
    <div className="text-center" data-testid="confirmation-screen">
      <div className="mb-4 flex justify-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
          <CalendarCheck className="h-8 w-8 text-green-600" aria-hidden="true" />
        </div>
      </div>
      <h2 className="mb-2 text-xl font-semibold text-foreground">{t('confirmation.title')}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{t('confirmation.subtitle', { name: customerName })}</p>
      <Card className="mb-6 text-left">
        <CardContent className="pt-4">
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.service')}</dt>
              <dd className="font-medium text-foreground">{service.name}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.date')}</dt>
              <dd className="font-medium text-foreground">
                {startDate.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'long' })}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">{t('confirmation.time')}</dt>
              <dd className="font-medium text-foreground">
                {startDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
                {' - '}
                {endDate.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">{t('confirmation.managementInfo')}</p>
        <Button variant="outline" onClick={handleCopyLink} className="w-full" data-testid="copy-management-link">
          {copied ? (
            <>
              <Check className="h-4 w-4" aria-hidden="true" />
              {t('confirmation.copied')}
            </>
          ) : (
            <>
              <Copy className="h-4 w-4" aria-hidden="true" />
              {t('confirmation.copyLink')}
            </>
          )}
        </Button>
        <Button
          variant="default"
          onClick={() => navigate(managementPath)}
          className="w-full"
          data-testid="go-to-management"
        >
          {t('confirmation.manageBooking')}
        </Button>
        <Button variant="outline" onClick={onBookAgain} className="w-full" data-testid="book-again">
          <CalendarPlus className="h-4 w-4" aria-hidden="true" />
          {t('confirmation.bookAgain')}
        </Button>
      </div>
    </div>
  )
}
