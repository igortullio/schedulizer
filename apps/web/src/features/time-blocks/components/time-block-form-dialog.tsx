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

interface TimeBlockFormData {
  date: string
  startTime: string
  endTime: string
  reason?: string
}

interface TimeBlockFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: TimeBlockFormData) => Promise<void>
}

export function TimeBlockFormDialog({ isOpen, onClose, onSubmit }: TimeBlockFormDialogProps) {
  const { t } = useTranslation('timeBlocks')
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  useEffect(() => {
    if (isOpen) {
      setDate('')
      setStartTime('09:00')
      setEndTime('18:00')
      setReason('')
      setFormError(null)
    }
  }, [isOpen])
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setFormError(null)
    if (!date) {
      setFormError(t('form.errors.dateRequired'))
      return
    }
    if (startTime >= endTime) {
      setFormError(t('form.errors.timeInvalid'))
      return
    }
    setIsSubmitting(true)
    try {
      await onSubmit({
        date,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
      })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('form.errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('form.title')}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4" data-testid="time-block-form">
          {formError ? (
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="date">{t('form.date')}</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              required
              data-testid="date-input"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">{t('form.startTime')}</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                required
                data-testid="start-time-input"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">{t('form.endTime')}</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                required
                data-testid="end-time-input"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">{t('form.reason')}</Label>
            <Input
              id="reason"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder={t('form.reasonPlaceholder')}
              data-testid="reason-input"
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
      </DialogContent>
    </Dialog>
  )
}
