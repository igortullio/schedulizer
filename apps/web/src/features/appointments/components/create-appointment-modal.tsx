import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

interface Service {
  id: string
  name: string
  durationMinutes: number
}

interface CreateAppointmentFormData {
  serviceId: string
  startDatetime: string
  endDatetime: string
  customerName: string
  customerEmail?: string
  customerPhone?: string
  status: AppointmentStatus
  notes?: string
}

type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show'

interface CreateAppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateAppointmentFormData) => Promise<void>
  services: Service[]
}

function getDefaultDate(): string {
  return new Date().toISOString().split('T')[0]
}

export function CreateAppointmentModal({ isOpen, onClose, onSubmit, services }: CreateAppointmentModalProps) {
  const { t } = useTranslation('appointments')
  const [serviceId, setServiceId] = useState('')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('10:00')
  const [customerName, setCustomerName] = useState('')
  const [customerEmail, setCustomerEmail] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [status, setStatus] = useState<AppointmentStatus>('confirmed')
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  useEffect(() => {
    if (isOpen) {
      setServiceId('')
      setDate(getDefaultDate())
      setStartTime('09:00')
      setEndTime('10:00')
      setCustomerName('')
      setCustomerEmail('')
      setCustomerPhone('')
      setStatus('confirmed')
      setNotes('')
      setFormError(null)
    }
  }, [isOpen])
  useEffect(() => {
    if (!serviceId || !startTime) return
    const selectedService = services.find(s => s.id === serviceId)
    if (!selectedService) return
    const [hours, minutes] = startTime.split(':').map(Number)
    const totalMinutes = hours * 60 + minutes + selectedService.durationMinutes
    const endHours = Math.floor(totalMinutes / 60)
    const endMins = totalMinutes % 60
    setEndTime(`${String(endHours).padStart(2, '0')}:${String(endMins).padStart(2, '0')}`)
  }, [serviceId, startTime, services])
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!serviceId) {
      setFormError(t('createForm.errors.serviceRequired'))
      return
    }
    if (!customerName.trim()) {
      setFormError(t('createForm.errors.customerNameRequired'))
      return
    }
    if (startTime >= endTime) {
      setFormError(t('createForm.errors.timeInvalid'))
      return
    }
    setIsSubmitting(true)
    try {
      const formData: CreateAppointmentFormData = {
        serviceId,
        startDatetime: new Date(`${date}T${startTime}:00`).toISOString(),
        endDatetime: new Date(`${date}T${endTime}:00`).toISOString(),
        customerName: customerName.trim(),
        status,
      }
      if (customerEmail.trim()) formData.customerEmail = customerEmail.trim()
      if (customerPhone.trim()) formData.customerPhone = customerPhone.trim()
      if (notes.trim()) formData.notes = notes.trim()
      await onSubmit(formData)
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('createForm.errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-screen overflow-y-auto max-sm:flex max-sm:h-full max-sm:max-w-full max-sm:flex-col max-sm:rounded-none max-sm:border-0">
        <DialogHeader>
          <DialogTitle>{t('createForm.title')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 max-sm:overflow-y-auto"
          data-testid="create-appointment-form"
        >
          {formError ? (
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="service">{t('createForm.service')}</Label>
            <Select value={serviceId} onValueChange={setServiceId}>
              <SelectTrigger id="service" data-testid="service-select">
                <SelectValue placeholder={t('createForm.servicePlaceholder')} />
              </SelectTrigger>
              <SelectContent>
                {services.map(service => (
                  <SelectItem key={service.id} value={service.id}>
                    {service.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment-date">{t('createForm.date')}</Label>
            <Input
              id="appointment-date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              data-testid="date-input"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="appointment-start-time">{t('createForm.startTime')}</Label>
              <Input
                id="appointment-start-time"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                data-testid="start-time-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appointment-end-time">{t('createForm.endTime')}</Label>
              <Input
                id="appointment-end-time"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                data-testid="end-time-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="customer-name">{t('createForm.customerName')}</Label>
            <Input
              id="customer-name"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder={t('createForm.customerNamePlaceholder')}
              required
              data-testid="customer-name-input"
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="customer-email">{t('createForm.customerEmail')}</Label>
              <Input
                id="customer-email"
                type="email"
                value={customerEmail}
                onChange={e => setCustomerEmail(e.target.value)}
                placeholder={t('createForm.customerEmailPlaceholder')}
                data-testid="customer-email-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customer-phone">{t('createForm.customerPhone')}</Label>
              <Input
                id="customer-phone"
                type="tel"
                value={customerPhone}
                onChange={e => setCustomerPhone(e.target.value)}
                placeholder={t('createForm.customerPhonePlaceholder')}
                data-testid="customer-phone-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment-status">{t('createForm.status')}</Label>
            <Select value={status} onValueChange={(value: string) => setStatus(value as AppointmentStatus)}>
              <SelectTrigger id="appointment-status" data-testid="status-select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="confirmed">{t('status.confirmed')}</SelectItem>
                <SelectItem value="pending">{t('status.pending')}</SelectItem>
                <SelectItem value="completed">{t('status.completed')}</SelectItem>
                <SelectItem value="cancelled">{t('status.cancelled')}</SelectItem>
                <SelectItem value="no_show">{t('status.no_show')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="appointment-notes">{t('createForm.notes')}</Label>
            <Textarea
              id="appointment-notes"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder={t('createForm.notesPlaceholder')}
              data-testid="notes-input"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-auto w-full" data-testid="submit-button">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('createForm.creating')}</span>
              </>
            ) : (
              t('createForm.create')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
