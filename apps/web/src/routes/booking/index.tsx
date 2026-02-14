import { Alert, AlertDescription } from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useParams } from 'react-router-dom'
import {
  BookingForm,
  ConfirmationScreen,
  DateSlotPicker,
  ServiceList,
  useBookingPage,
  useCreateAppointment,
  useSlots,
} from '@/features/booking'
import type { BookingService } from '@/features/booking/hooks/use-booking-page'
import type { TimeSlot } from '@/features/booking/hooks/use-slots'

type BookingStep = 'services' | 'slots' | 'form' | 'confirmation'

export function Component() {
  const { slug = '' } = useParams<{ slug: string }>()
  const { t } = useTranslation('booking')
  const { data, state: pageState } = useBookingPage(slug)
  const { slots, state: slotsState, error: slotsError, fetchSlots } = useSlots()
  const {
    result: appointmentResult,
    state: createState,
    error: createError,
    createAppointment,
  } = useCreateAppointment()
  const [step, setStep] = useState<BookingStep>('services')
  const [selectedService, setSelectedService] = useState<BookingService | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [customerName, setCustomerName] = useState('')
  function handleSelectService(service: BookingService) {
    setSelectedService(service)
    setStep('slots')
  }
  function handleSelectSlot(slot: TimeSlot) {
    setSelectedSlot(slot)
    setStep('form')
  }
  function handleBackToServices() {
    setSelectedService(null)
    setSelectedSlot(null)
    setStep('services')
  }
  function handleBackToSlots() {
    setSelectedSlot(null)
    setStep('slots')
  }
  async function handleSubmitBooking(formData: { customerName: string; customerEmail: string; customerPhone: string }) {
    if (!selectedService || !selectedSlot) return
    setCustomerName(formData.customerName)
    const result = await createAppointment(slug, {
      serviceId: selectedService.id,
      startTime: selectedSlot.startTime,
      customerName: formData.customerName,
      customerEmail: formData.customerEmail,
      customerPhone: formData.customerPhone,
    })
    if (result) {
      setStep('confirmation')
    }
  }
  if (pageState === 'loading') {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (pageState === 'not-found') {
    return (
      <div className="py-16 text-center" data-testid="not-found">
        <h2 className="text-xl font-semibold text-foreground">{t('notFound.title')}</h2>
        <p className="mt-2 text-sm text-muted-foreground">{t('notFound.description')}</p>
      </div>
    )
  }
  if (pageState === 'error' || !data) {
    return (
      <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="page-error">
        <AlertDescription>{t('error.generic')}</AlertDescription>
      </Alert>
    )
  }
  return (
    <div data-testid="booking-page">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{data.organizationName}</h1>
        {step === 'services' ? <p className="mt-1 text-sm text-muted-foreground">{t('services.subtitle')}</p> : null}
      </div>
      {step === 'services' ? <ServiceList services={data.services} onSelect={handleSelectService} /> : null}
      {step === 'slots' && selectedService ? (
        <DateSlotPicker
          slug={slug}
          serviceId={selectedService.id}
          slots={slots}
          slotsState={slotsState}
          slotsError={slotsError}
          onFetchSlots={fetchSlots}
          onSelectSlot={handleSelectSlot}
          onBack={handleBackToServices}
        />
      ) : null}
      {step === 'form' && selectedService && selectedSlot ? (
        <BookingForm
          service={selectedService}
          slot={selectedSlot}
          isSubmitting={createState === 'loading'}
          error={
            createState === 'conflict' ? t('form.errors.slotConflict') : createState === 'error' ? createError : null
          }
          onSubmit={handleSubmitBooking}
          onBack={handleBackToSlots}
        />
      ) : null}
      {step === 'confirmation' && selectedService && appointmentResult ? (
        <ConfirmationScreen
          service={selectedService}
          appointment={appointmentResult}
          slug={slug}
          customerName={customerName}
        />
      ) : null}
    </div>
  )
}

export default Component
