import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@igortullio-ui/react'
import { Loader2, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScheduleDayRow } from '@/features/schedules'
import { useSchedules } from '@/features/schedules/hooks/use-schedules'

const DAYS_IN_WEEK = 7

interface Period {
  startTime: string
  endTime: string
}

interface DaySchedule {
  dayOfWeek: number
  isActive: boolean
  periods: Period[]
}

interface ScheduleDialogProps {
  serviceId: string
  serviceName: string
  isOpen: boolean
  onClose: () => void
}

export function ScheduleDialog({ serviceId, serviceName, isOpen, onClose }: ScheduleDialogProps) {
  const { t } = useTranslation('schedules')
  const { schedules, state, updateSchedules } = useSchedules(serviceId)
  const [localSchedules, setLocalSchedules] = useState<DaySchedule[]>([])
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  useEffect(() => {
    if (state === 'success' && schedules.length > 0) {
      setLocalSchedules(
        schedules.map(s => ({
          dayOfWeek: s.dayOfWeek,
          isActive: s.isActive,
          periods: s.periods.map(p => ({ startTime: p.startTime, endTime: p.endTime })),
        })),
      )
    } else if (state === 'success' && schedules.length === 0) {
      setLocalSchedules(
        Array.from({ length: DAYS_IN_WEEK }, (_, i) => ({
          dayOfWeek: i,
          isActive: false,
          periods: [],
        })),
      )
    }
  }, [schedules, state])
  const handleToggleActive = useCallback((dayOfWeek: number, isActive: boolean) => {
    setLocalSchedules(prev =>
      prev.map(s => {
        if (s.dayOfWeek !== dayOfWeek) return s
        if (isActive && s.periods.length === 0) {
          return { ...s, isActive, periods: [{ startTime: '09:00', endTime: '18:00' }] }
        }
        return { ...s, isActive }
      }),
    )
  }, [])
  const handlePeriodsChange = useCallback((dayOfWeek: number, periods: Period[]) => {
    setLocalSchedules(prev => prev.map(s => (s.dayOfWeek === dayOfWeek ? { ...s, periods } : s)))
  }, [])
  async function handleSave() {
    setSaveError(null)
    setSaveSuccess(false)
    setIsSaving(true)
    try {
      await updateSchedules(localSchedules)
      setSaveSuccess(true)
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('errors.saveFailed'))
    } finally {
      setIsSaving(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onClose()}>
      <DialogContent className="max-h-screen overflow-y-auto sm:max-w-2xl max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0">
        <DialogHeader>
          <DialogTitle>
            {t('title')} - {serviceName}
          </DialogTitle>
        </DialogHeader>
        {saveError ? (
          <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="save-error">
            <AlertDescription>{saveError}</AlertDescription>
          </Alert>
        ) : null}
        {saveSuccess ? (
          <Alert className="border-0 bg-green-500/10 text-green-700" data-testid="save-success">
            <AlertDescription>{t('saveSuccess')}</AlertDescription>
          </Alert>
        ) : null}
        {state === 'loading' ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : (
          <div className="space-y-3" data-testid="schedules-list">
            {localSchedules.map(schedule => (
              <ScheduleDayRow
                key={schedule.dayOfWeek}
                dayOfWeek={schedule.dayOfWeek}
                isActive={schedule.isActive}
                periods={schedule.periods}
                onToggleActive={handleToggleActive}
                onPeriodsChange={handlePeriodsChange}
              />
            ))}
          </div>
        )}
        <div className="flex justify-end pt-4">
          <Button onClick={handleSave} disabled={isSaving} data-testid="save-schedules-button">
            {isSaving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('saving')}</span>
              </>
            ) : (
              <>
                <Save className="h-4 w-4" aria-hidden="true" />
                {t('save')}
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
