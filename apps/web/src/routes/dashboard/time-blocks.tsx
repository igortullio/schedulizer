import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label } from '@igortullio-ui/react'
import { Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimeBlockCard, useTimeBlocks } from '@/features/time-blocks'

const DAYS_RANGE = 90

function getDateRange() {
  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + DAYS_RANGE)
  const to = futureDate.toISOString().split('T')[0]
  return { from, to }
}

export function Component() {
  const { t } = useTranslation('timeBlocks')
  const { from, to } = useMemo(getDateRange, [])
  const { timeBlocks, state, error, createTimeBlock, deleteTimeBlock } = useTimeBlocks(from, to)
  const [showForm, setShowForm] = useState(false)
  const [date, setDate] = useState('')
  const [startTime, setStartTime] = useState('09:00')
  const [endTime, setEndTime] = useState('18:00')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
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
      await createTimeBlock({
        date,
        startTime,
        endTime,
        reason: reason.trim() || undefined,
      })
      setShowForm(false)
      setDate('')
      setStartTime('09:00')
      setEndTime('18:00')
      setReason('')
    } catch (err) {
      setFormError(err instanceof Error ? err.message : t('form.errors.createFailed'))
    } finally {
      setIsSubmitting(false)
    }
  }
  async function handleDelete(id: string) {
    try {
      await deleteTimeBlock(id)
    } catch {
      // Error handled in hook
    }
  }
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} data-testid="add-time-block-button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('actions.create')}
        </Button>
      </div>
      {showForm ? (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t('form.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4" data-testid="time-block-form">
              {formError ? (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="form-error">
                  {formError}
                </div>
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
              <div className="flex gap-2">
                <Button type="submit" disabled={isSubmitting} data-testid="submit-button">
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" aria-hidden="true" />
                      <span>{t('form.creating')}</span>
                    </>
                  ) : (
                    t('form.create')
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                  {t('form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      ) : null}
      {state === 'loading' ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : error ? (
        <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive" data-testid="error-message">
          {error}
        </div>
      ) : timeBlocks.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-state">
          <p className="text-muted-foreground">{t('emptyState')}</p>
        </div>
      ) : (
        <div className="space-y-3" data-testid="time-blocks-list">
          {timeBlocks.map(block => (
            <TimeBlockCard
              key={block.id}
              id={block.id}
              date={block.date}
              startTime={block.startTime}
              endTime={block.endTime}
              reason={block.reason}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default Component
