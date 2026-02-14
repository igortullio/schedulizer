import { Button, Input, Switch } from '@igortullio-ui/react'
import { Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Period {
  startTime: string
  endTime: string
}

interface ScheduleDayRowProps {
  dayOfWeek: number
  isActive: boolean
  periods: Period[]
  onToggleActive: (dayOfWeek: number, isActive: boolean) => void
  onPeriodsChange: (dayOfWeek: number, periods: Period[]) => void
}

const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const

export function ScheduleDayRow({ dayOfWeek, isActive, periods, onToggleActive, onPeriodsChange }: ScheduleDayRowProps) {
  const { t } = useTranslation('schedules')
  function handleAddPeriod() {
    onPeriodsChange(dayOfWeek, [...periods, { startTime: '09:00', endTime: '18:00' }])
  }
  function handleRemovePeriod(index: number) {
    onPeriodsChange(
      dayOfWeek,
      periods.filter((_, i) => i !== index),
    )
  }
  function handlePeriodChange(index: number, field: 'startTime' | 'endTime', value: string) {
    const updated = periods.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    onPeriodsChange(dayOfWeek, updated)
  }
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4" data-testid={`schedule-day-${dayOfWeek}`}>
      <div className="flex w-32 shrink-0 items-center gap-2 pt-1">
        <Switch
          checked={isActive}
          onCheckedChange={(checked: boolean) => onToggleActive(dayOfWeek, checked)}
          data-testid={`day-toggle-${dayOfWeek}`}
        />
        <span className="text-sm font-medium">{t(`days.${DAY_KEYS[dayOfWeek]}`)}</span>
      </div>
      <div className="flex-1">
        {isActive ? (
          <div className="space-y-2">
            {periods.map((period, index) => (
              <div key={`${period.startTime}-${period.endTime}-${index}`} className="flex items-center gap-2">
                <Input
                  type="time"
                  value={period.startTime}
                  onChange={e => handlePeriodChange(index, 'startTime', e.target.value)}
                  className="w-32"
                  data-testid={`period-start-${dayOfWeek}-${index}`}
                />
                <span className="text-sm text-muted-foreground">{t('to')}</span>
                <Input
                  type="time"
                  value={period.endTime}
                  onChange={e => handlePeriodChange(index, 'endTime', e.target.value)}
                  className="w-32"
                  data-testid={`period-end-${dayOfWeek}-${index}`}
                />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemovePeriod(index)}
                  data-testid={`remove-period-${dayOfWeek}-${index}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                </Button>
              </div>
            ))}
            <Button variant="ghost" size="sm" onClick={handleAddPeriod} data-testid={`add-period-${dayOfWeek}`}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('addPeriod')}
            </Button>
          </div>
        ) : (
          <p className="pt-1 text-sm text-muted-foreground">{t('dayOff')}</p>
        )}
      </div>
    </div>
  )
}
