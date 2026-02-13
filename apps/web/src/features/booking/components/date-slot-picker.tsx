import { Button } from '@igortullio-ui/react'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimeSlot } from '../hooks/use-slots'

const VISIBLE_DAYS = 7
const MAX_FUTURE_DAYS = 60

interface DateSlotPickerProps {
  slug: string
  serviceId: string
  slots: TimeSlot[]
  slotsState: 'idle' | 'loading' | 'success' | 'error'
  slotsError: string | null
  onFetchSlots: (slug: string, serviceId: string, date: string) => Promise<void>
  onSelectSlot: (slot: TimeSlot) => void
  onBack: () => void
}

export function DateSlotPicker({
  slug,
  serviceId,
  slots,
  slotsState,
  slotsError,
  onFetchSlots,
  onSelectSlot,
  onBack,
}: DateSlotPickerProps) {
  const { t, i18n } = useTranslation('booking')
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateToYmd(new Date()))
  const [startOffset, setStartOffset] = useState(0)
  useEffect(() => {
    void onFetchSlots(slug, serviceId, selectedDate)
  }, [slug, serviceId, selectedDate, onFetchSlots])
  function handleDateSelect(date: string) {
    setSelectedDate(date)
  }
  function handlePrevWeek() {
    setStartOffset(prev => Math.max(0, prev - VISIBLE_DAYS))
  }
  function handleNextWeek() {
    setStartOffset(prev => Math.min(MAX_FUTURE_DAYS - VISIBLE_DAYS, prev + VISIBLE_DAYS))
  }
  const dates = generateDates(startOffset, VISIBLE_DAYS)
  const canGoPrev = startOffset > 0
  const canGoNext = startOffset + VISIBLE_DAYS < MAX_FUTURE_DAYS
  return (
    <div data-testid="date-slot-picker">
      <div className="mb-4 flex items-center gap-2">
        <Button variant="ghost" size="sm" onClick={onBack} data-testid="back-to-services">
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          {t('slots.back')}
        </Button>
      </div>
      <h3 className="mb-3 text-lg font-medium text-foreground">{t('slots.selectDate')}</h3>
      <div className="mb-4 flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          onClick={handlePrevWeek}
          disabled={!canGoPrev}
          aria-label={t('slots.previousWeek')}
          data-testid="prev-week"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {dates.map(date => {
            const isSelected = date.value === selectedDate
            return (
              <button
                key={date.value}
                type="button"
                onClick={() => handleDateSelect(date.value)}
                className={`flex min-w-[4rem] flex-1 flex-col items-center rounded-lg px-2 py-2 text-sm transition-colors ${
                  isSelected ? 'bg-primary text-primary-foreground' : 'bg-card hover:bg-accent/50'
                }`}
                data-testid={`date-button-${date.value}`}
              >
                <span className="text-xs uppercase">{formatWeekday(date.date, i18n.language)}</span>
                <span className="text-lg font-medium">{date.date.getDate()}</span>
                <span className="text-xs">{formatMonth(date.date, i18n.language)}</span>
              </button>
            )
          })}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleNextWeek}
          disabled={!canGoNext}
          aria-label={t('slots.nextWeek')}
          data-testid="next-week"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <h3 className="mb-3 text-lg font-medium text-foreground">{t('slots.selectTime')}</h3>
      {slotsState === 'loading' ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : slotsState === 'error' ? (
        <div
          className="rounded-md bg-destructive/10 p-4 text-center text-sm text-destructive"
          data-testid="slots-error"
        >
          {slotsError}
        </div>
      ) : slots.length === 0 ? (
        <div className="rounded-md border border-dashed p-8 text-center" data-testid="no-slots">
          <p className="text-sm text-muted-foreground">{t('slots.empty')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4" data-testid="slots-grid">
          {slots.map(slot => (
            <Button
              key={slot.startTime}
              variant="outline"
              onClick={() => onSelectSlot(slot)}
              className="text-sm"
              data-testid={`slot-button-${slot.startTime}`}
            >
              {formatSlotTime(slot.startTime)}
            </Button>
          ))}
        </div>
      )}
    </div>
  )
}

function generateDates(startOffset: number, count: number): { value: string; date: Date }[] {
  const today = new Date()
  return Array.from({ length: count }, (_, i) => {
    const date = new Date(today)
    date.setDate(today.getDate() + startOffset + i)
    return { value: formatDateToYmd(date), date }
  })
}

function formatDateToYmd(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatWeekday(date: Date, language: string): string {
  const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(locale, { weekday: 'short' })
}

function formatMonth(date: Date, language: string): string {
  const locale = language === 'pt-BR' ? 'pt-BR' : 'en-US'
  return date.toLocaleDateString(locale, { month: 'short' })
}

function formatSlotTime(isoString: string): string {
  const date = new Date(isoString)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
