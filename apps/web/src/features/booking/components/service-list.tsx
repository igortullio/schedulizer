import { Card, CardContent, CardHeader, CardTitle } from '@igortullio-ui/react'
import { ChevronRight, Clock, DollarSign } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { BookingService } from '../hooks/use-booking-page'

interface ServiceListProps {
  services: BookingService[]
  onSelect: (service: BookingService) => void
}

export function ServiceList({ services, onSelect }: ServiceListProps) {
  const { t, i18n } = useTranslation('booking')
  if (services.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center" data-testid="no-services">
        <p className="text-muted-foreground">{t('services.empty')}</p>
      </div>
    )
  }
  return (
    <div className="grid gap-3" data-testid="service-list">
      {services.map(service => (
        <Card
          key={service.id}
          className="cursor-pointer transition-colors hover:bg-accent/50"
          onClick={() => onSelect(service)}
          data-testid={`service-item-${service.id}`}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base font-medium">{service.name}</CardTitle>
            <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            {service.description ? <p className="mb-3 text-sm text-muted-foreground">{service.description}</p> : null}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" aria-hidden="true" />
                <span>
                  {service.durationMinutes} {t('services.minutes')}
                </span>
              </div>
              {service.price ? (
                <div className="flex items-center gap-1">
                  <DollarSign className="h-4 w-4" aria-hidden="true" />
                  <span>{formatServicePrice(service.price, i18n.language)}</span>
                </div>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

function formatServicePrice(price: string, language: string): string {
  const numericPrice = Number.parseFloat(price)
  if (Number.isNaN(numericPrice)) return price
  const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
  const currency = language === 'pt-BR' ? 'BRL' : 'USD'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(numericPrice)
}
