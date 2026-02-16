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
} from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyInput } from '@/components/currency-input'
import { parseCurrencyInput } from '@/lib/format'

const MIN_DURATION = 5
const MAX_DURATION = 480

interface ServiceFormData {
  name: string
  description?: string
  duration: number
  price: string
}

interface ServiceFormDialogProps {
  mode: 'create' | 'edit'
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: ServiceFormData) => Promise<void>
  service?: {
    name: string
    description: string
    durationMinutes: number
    price: string
  }
}

function priceToCents(price: string): number {
  const parsed = Number.parseFloat(price)
  if (Number.isNaN(parsed)) return 0
  return Math.round(parsed * 100)
}

export function ServiceFormDialog({ mode, isOpen, onClose, onSubmit, service }: ServiceFormDialogProps) {
  const { t } = useTranslation('services')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [duration, setDuration] = useState('')
  const [priceInCents, setPriceInCents] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  useEffect(() => {
    if (isOpen && mode === 'edit' && service) {
      setName(service.name)
      setDescription(service.description)
      setDuration(String(service.durationMinutes))
      setPriceInCents(priceToCents(service.price))
    } else if (isOpen && mode === 'create') {
      setName('')
      setDescription('')
      setDuration('')
      setPriceInCents(0)
    }
    setFormError(null)
  }, [isOpen, mode, service])
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
    if (priceInCents <= 0) {
      setFormError(t('form.errors.priceInvalid'))
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        description: description.trim() || undefined,
        duration: durationNum,
        price: parseCurrencyInput(priceInCents),
      })
    } catch (err) {
      const errorKey = mode === 'create' ? 'form.errors.createFailed' : 'form.errors.updateFailed'
      setFormError(err instanceof Error ? err.message : t(errorKey))
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-screen overflow-y-auto max-sm:flex max-sm:h-full max-sm:max-w-full max-sm:flex-col max-sm:rounded-none max-sm:border-0">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? t('form.createTitle') : t('form.editTitle')}</DialogTitle>
        </DialogHeader>
        <form
          onSubmit={handleSubmit}
          className="flex flex-1 flex-col gap-4 max-sm:overflow-y-auto"
          data-testid="service-form"
        >
          {formError ? (
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="service-name">{t('form.name')}</Label>
            <Input
              id="service-name"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('form.namePlaceholder')}
              required
              data-testid="name-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-description">{t('form.description')}</Label>
            <Input
              id="service-description"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={t('form.descriptionPlaceholder')}
              data-testid="description-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="service-duration">{t('form.duration')}</Label>
            <Input
              id="service-duration"
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
            <Label htmlFor="service-price">{t('form.price')}</Label>
            <CurrencyInput
              id="service-price"
              value={priceInCents}
              onChange={setPriceInCents}
              required
              data-testid="price-input"
            />
          </div>
          <Button type="submit" disabled={isSubmitting} className="mt-auto w-full" data-testid="submit-button">
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{mode === 'create' ? t('form.creating') : t('form.saving')}</span>
              </>
            ) : mode === 'create' ? (
              t('form.create')
            ) : (
              t('form.save')
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}
