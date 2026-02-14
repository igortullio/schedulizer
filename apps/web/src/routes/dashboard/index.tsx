import { Button, Card, CardContent, CardHeader, CardTitle } from '@igortullio-ui/react'
import { CalendarDays, Clock, Loader2, Package, Plus } from 'lucide-react'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAppointments } from '@/features/appointments'
import { useServices } from '@/features/services'
import { useTimeBlocks } from '@/features/time-blocks'

const DAYS_RANGE = 90

function getTodayRange() {
  const today = new Date().toISOString().split('T')[0]
  return { from: today, to: today }
}

function getTimeBlockRange() {
  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + DAYS_RANGE)
  const to = futureDate.toISOString().split('T')[0]
  return { from, to }
}

export function Component() {
  const { t } = useTranslation('dashboard')
  const navigate = useNavigate()
  const { services, state: servicesState } = useServices()
  const { appointments, state: appointmentsState } = useAppointments()
  const todayRange = useMemo(getTodayRange, [])
  const timeBlockRange = useMemo(getTimeBlockRange, [])
  const { timeBlocks, state: timeBlocksState } = useTimeBlocks(timeBlockRange.from, timeBlockRange.to)
  const isLoading = servicesState === 'loading' || appointmentsState === 'loading' || timeBlocksState === 'loading'
  const todayAppointments = appointments.filter(a => a.startDatetime.startsWith(todayRange.from))
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const stats = [
    { title: t('overview.totalServices'), value: services.length, icon: Package },
    { title: t('overview.todayAppointments'), value: todayAppointments.length, icon: CalendarDays },
    { title: t('overview.pendingAppointments'), value: pendingAppointments.length, icon: Clock },
    { title: t('overview.activeTimeBlocks'), value: timeBlocks.length, icon: Clock },
  ]
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('overview.title')}</h1>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div>
        <h2 className="mb-4 text-lg font-semibold text-foreground">{t('overview.quickActions')}</h2>
        <div className="flex flex-wrap gap-3">
          <Button onClick={() => navigate('/dashboard/services')} data-testid="quick-create-service">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('overview.createService')}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate('/dashboard/appointments')}
            data-testid="quick-view-appointments"
          >
            <CalendarDays className="h-4 w-4" aria-hidden="true" />
            {t('overview.viewAppointments')}
          </Button>
        </div>
      </div>
    </div>
  )
}

export default Component
