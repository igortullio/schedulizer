import { Alert, AlertDescription, Button } from '@igortullio-ui/react'
import { Loader2, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TimeBlockCard, TimeBlockFormDialog, useTimeBlocks } from '@/features/time-blocks'

const DAYS_RANGE = 90

function getDateRange() {
  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + DAYS_RANGE)
  const to = futureDate.toISOString().split('T')[0]
  return { from, to }
}

interface TimeBlockFormData {
  date: string
  startTime: string
  endTime: string
  reason?: string
}

export function Component() {
  const { t } = useTranslation('timeBlocks')
  const { from, to } = useMemo(getDateRange, [])
  const { timeBlocks, state, error, createTimeBlock, deleteTimeBlock } = useTimeBlocks(from, to)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  async function handleCreateSubmit(data: TimeBlockFormData) {
    await createTimeBlock(data)
    setIsDialogOpen(false)
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
        <Button onClick={() => setIsDialogOpen(true)} data-testid="add-time-block-button">
          <Plus className="h-4 w-4" aria-hidden="true" />
          {t('actions.create')}
        </Button>
      </div>
      <TimeBlockFormDialog isOpen={isDialogOpen} onClose={() => setIsDialogOpen(false)} onSubmit={handleCreateSubmit} />
      {state === 'loading' ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : error ? (
        <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="error-message">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : timeBlocks.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-state">
          <p className="text-muted-foreground">{t('emptyState')}</p>
        </div>
      ) : (
        <div className="grid gap-4" data-testid="time-blocks-list">
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
