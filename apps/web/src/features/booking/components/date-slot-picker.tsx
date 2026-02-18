import { Alert, AlertDescription, Button } from '@igortullio-ui/react'
import { clientEnv } from '@schedulizer/env/client'
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { TimeSlot } from '../hooks/use-slots'

const VISIBLE_DAYS = 7
const MAX_FUTURE_DAYS = 60
const SCAN_BATCH_SIZE = 14

interface DateEntry {
  value: string
  date: Date
}

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
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [availableDates, setAvailableDates] = useState<DateEntry[]>([])
  const [pageIndex, setPageIndex] = useState(0)
  const [loadingDates, setLoadingDates] = useState(true)
  const [scannedUpTo, setScannedUpTo] = useState(0)
  const scanLockRef = useRef(false)
  const checkDateAvailability = useCallback(
    async (dateStr: string): Promise<boolean> => {
      try {
        const response = await fetch(
          `${clientEnv.apiUrl}/api/booking/${slug}/services/${serviceId}/slots?date=${dateStr}`,
        )
        if (!response.ok) return false
        const result: { data: { slots: TimeSlot[] } } = await response.json()
        return result.data.slots.length > 0
      } catch {
        return false
      }
    },
    [slug, serviceId],
  )
  const scanForAvailableDates = useCallback(
    async (fromOffset: number, minCount: number) => {
      if (scanLockRef.current) return
      scanLockRef.current = true
      setLoadingDates(true)
      const today = new Date()
      const found: DateEntry[] = []
      let offset = fromOffset
      while (found.length < minCount && offset < MAX_FUTURE_DAYS) {
        const batchEnd = Math.min(offset + SCAN_BATCH_SIZE, MAX_FUTURE_DAYS)
        const batch: DateEntry[] = []
        for (let i = offset; i < batchEnd; i++) {
          const date = new Date(today)
          date.setDate(today.getDate() + i)
          batch.push({ value: formatDateToYmd(date), date })
        }
        const results = await Promise.all(batch.map(entry => checkDateAvailability(entry.value)))
        for (let i = 0; i < batch.length; i++) {
          if (results[i]) found.push(batch[i])
        }
        offset = batchEnd
      }
      setScannedUpTo(offset)
      setAvailableDates(prev => {
        const existingValues = new Set(prev.map(d => d.value))
        const merged = [...prev]
        for (const entry of found) {
          if (!existingValues.has(entry.value)) merged.push(entry)
        }
        return merged
      })
      setLoadingDates(false)
      scanLockRef.current = false
      return found
    },
    [checkDateAvailability],
  )
  useEffect(() => {
    setAvailableDates([])
    setPageIndex(0)
    setScannedUpTo(0)
    setSelectedDate(null)
    scanLockRef.current = false
    void scanForAvailableDates(0, VISIBLE_DAYS).then(found => {
      if (found && found.length > 0) {
        setSelectedDate(found[0].value)
      }
    })
  }, [scanForAvailableDates])
  useEffect(() => {
    if (!selectedDate) return
    void onFetchSlots(slug, serviceId, selectedDate)
  }, [slug, serviceId, selectedDate, onFetchSlots])
  const pageStart = pageIndex * VISIBLE_DAYS
  const pageEnd = pageStart + VISIBLE_DAYS
  const visibleDates = availableDates.slice(pageStart, pageEnd)
  const canGoPrev = pageIndex > 0
  const needsMore = pageEnd >= availableDates.length && scannedUpTo < MAX_FUTURE_DAYS
  const canGoNext = pageEnd < availableDates.length || needsMore
  function handleDateSelect(date: string) {
    setSelectedDate(date)
  }
  function handlePrevPage() {
    setPageIndex(prev => Math.max(0, prev - 1))
  }
  async function handleNextPage() {
    const nextPageStart = (pageIndex + 1) * VISIBLE_DAYS
    const nextPageEnd = nextPageStart + VISIBLE_DAYS
    if (nextPageEnd > availableDates.length && scannedUpTo < MAX_FUTURE_DAYS) {
      const needed = nextPageEnd - availableDates.length
      await scanForAvailableDates(scannedUpTo, needed)
    }
    setPageIndex(prev => prev + 1)
  }
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
          onClick={handlePrevPage}
          disabled={!canGoPrev}
          aria-label={t('slots.previousWeek')}
          data-testid="prev-week"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </Button>
        <div className="flex flex-1 gap-1 overflow-x-auto">
          {loadingDates ? (
            <div className="flex flex-1 items-center justify-center py-4">
              <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : visibleDates.length === 0 ? (
            <div className="flex flex-1 items-center justify-center py-4">
              <p className="text-sm text-muted-foreground">{t('slots.noDatesAvailable')}</p>
            </div>
          ) : (
            visibleDates.map(date => {
              const isSelected = date.value === selectedDate
              return (
                <Button
                  key={date.value}
                  variant={isSelected ? 'default' : 'ghost'}
                  onClick={() => handleDateSelect(date.value)}
                  className={`flex h-auto min-w-0 flex-1 flex-col items-center rounded-lg px-1 py-2 text-sm ${
                    isSelected ? '' : 'bg-card hover:bg-accent/50'
                  }`}
                  data-testid={`date-button-${date.value}`}
                >
                  <span className="text-xs uppercase">{formatWeekday(date.date, i18n.language)}</span>
                  <span className="text-lg font-medium">{date.date.getDate()}</span>
                  <span className="text-xs">{formatMonth(date.date, i18n.language)}</span>
                </Button>
              )
            })
          )}
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => void handleNextPage()}
          disabled={!canGoNext || loadingDates}
          aria-label={t('slots.nextWeek')}
          data-testid="next-week"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </div>
      <h3 className="mb-3 text-lg font-medium text-foreground">{t('slots.selectTime')}</h3>
      {!selectedDate || loadingDates ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : slotsState === 'loading' ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : slotsState === 'error' ? (
        <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="slots-error">
          <AlertDescription>{slotsError ? t(slotsError as 'slots.errors.fetchFailed') : null}</AlertDescription>
        </Alert>
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
