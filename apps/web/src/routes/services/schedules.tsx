import { Button } from '@igortullio-ui/react'
import { ArrowLeft, Loader2, Save } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { ScheduleDayRow, useSchedules } from '@/features/schedules'
import { useSession } from '@/lib/auth-client'

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

export function Component() {
  const { t } = useTranslation('schedules')
  const navigate = useNavigate()
  const { serviceId } = useParams<{ serviceId: string }>()
  const { data: session, isPending: sessionPending } = useSession()
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
  function handleBack() {
    navigate('/services')
  }
  if (sessionPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  return (
    <div className="min-h-screen bg-background px-4 py-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBack} data-testid="back-button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToServices')}
          </Button>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
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
        {saveError ? (
          <div className="mb-4 rounded-md bg-destructive/10 p-3 text-sm text-destructive" data-testid="save-error">
            {saveError}
          </div>
        ) : null}
        {saveSuccess ? (
          <div className="mb-4 rounded-md bg-green-500/10 p-3 text-sm text-green-700" data-testid="save-success">
            {t('saveSuccess')}
          </div>
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
      </div>
    </div>
  )
}

export default Component
