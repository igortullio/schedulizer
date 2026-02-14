import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import { Calendar, Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { CalendarView, useAppointments } from '@/features/appointments'
import { ScheduleDialog } from '@/features/schedules/components/schedule-dialog'
import { useServices } from '@/features/services'
import { ServiceFormDialog } from '@/features/services/components/service-form-dialog'
import { TimeBlockFormDialog, useTimeBlocks } from '@/features/time-blocks'
import { formatPrice, getLocale } from '@/lib/format'

const DAYS_RANGE = 90
const MAX_CARD_ITEMS = 3

function getTimeBlockRange() {
  const today = new Date()
  const from = today.toISOString().split('T')[0]
  const futureDate = new Date(today)
  futureDate.setDate(futureDate.getDate() + DAYS_RANGE)
  const to = futureDate.toISOString().split('T')[0]
  return { from, to }
}

function getTodayRange() {
  const today = new Date().toISOString().split('T')[0]
  return { from: today, to: today }
}

function formatTime(datetime: string): string {
  const date = new Date(datetime)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatShortDate(dateString: string, locale: string): string {
  const [year, month, day] = dateString.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))
  return date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' })
}

interface EditingService {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
}

export function Component() {
  const { t, i18n } = useTranslation('dashboard')
  const { t: tServices } = useTranslation('services')
  const { services, state: servicesState, createService, updateService, deleteService, toggleActive } = useServices()
  const { appointments, state: appointmentsState } = useAppointments()
  const todayRange = useMemo(getTodayRange, [])
  const timeBlockRange = useMemo(getTimeBlockRange, [])
  const { timeBlocks, state: timeBlocksState, createTimeBlock } = useTimeBlocks(timeBlockRange.from, timeBlockRange.to)
  const isLoading = servicesState === 'loading' || appointmentsState === 'loading' || timeBlocksState === 'loading'
  const todayAppointments = appointments.filter(a => a.startDatetime.startsWith(todayRange.from))
  const pendingAppointments = appointments.filter(a => a.status === 'pending')
  const locale = getLocale(i18n.language)
  const [isCreateServiceOpen, setIsCreateServiceOpen] = useState(false)
  const [editingService, setEditingService] = useState<EditingService | null>(null)
  const [scheduleService, setScheduleService] = useState<{ id: string; name: string } | null>(null)
  const [isTimeBlockDialogOpen, setIsTimeBlockDialogOpen] = useState(false)
  function handleEditService(id: string) {
    const service = services.find(s => s.id === id)
    if (!service) return
    setEditingService(service)
  }
  async function handleDeleteService(id: string) {
    try {
      await deleteService(id)
    } catch {
      // Error handled in hook
    }
  }
  async function handleToggleActive(id: string, active: boolean) {
    try {
      await toggleActive(id, active)
    } catch {
      // Error handled in hook
    }
  }
  function handleSchedule(id: string) {
    const service = services.find(s => s.id === id)
    if (!service) return
    setScheduleService({ id: service.id, name: service.name })
  }
  async function handleCreateServiceSubmit(data: {
    name: string
    description?: string
    duration: number
    price: string
  }) {
    const created = await createService(data)
    setIsCreateServiceOpen(false)
    if (created) {
      setScheduleService({ id: created.id, name: created.name })
    }
  }
  async function handleEditServiceSubmit(data: {
    name: string
    description?: string
    duration: number
    price: string
  }) {
    if (!editingService) return
    await updateService(editingService.id, data)
    setEditingService(null)
  }
  async function handleCreateTimeBlock(data: { date: string; startTime: string; endTime: string; reason?: string }) {
    await createTimeBlock(data)
    setIsTimeBlockDialogOpen(false)
  }
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  return (
    <div className="flex min-h-full flex-col-reverse gap-6 sm:flex-col">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" data-testid="stats-grid">
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('sections.services')}
              <Badge variant="secondary">{services.length}</Badge>
            </CardTitle>
            <CardAction className="flex items-center gap-1">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to="/dashboard/services">{t('sections.viewAll')}</Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsCreateServiceOpen(true)}
                      data-testid="dashboard-create-service"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('sections.newService')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardAction>
          </CardHeader>
          <CardContent className="px-3">
            {services.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noServices')}</p>
            ) : (
              <ul className="space-y-2">
                {services.slice(0, MAX_CARD_ITEMS).map(service => (
                  <li key={service.id} className="flex items-center justify-between gap-1">
                    <div className="min-w-0">
                      <p className="truncate text-sm">{service.name}</p>
                      {service.price ? (
                        <p className="text-xs text-muted-foreground">
                          {formatPrice(Number(service.price), i18n.language)}
                        </p>
                      ) : null}
                    </div>
                    <TooltipProvider>
                      <div className="flex shrink-0 items-center">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleEditService(service.id)}
                            >
                              <Pencil className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tServices('actions.edit')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleSchedule(service.id)}
                            >
                              <Calendar className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tServices('actions.schedule')}</TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleToggleActive(service.id, !service.active)}
                            >
                              <Power className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            {service.active ? tServices('actions.deactivate') : tServices('actions.activate')}
                          </TooltipContent>
                        </Tooltip>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleDeleteService(service.id)}
                            >
                              <Trash2 className="h-3 w-3" aria-hidden="true" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>{tServices('actions.delete')}</TooltipContent>
                        </Tooltip>
                      </div>
                    </TooltipProvider>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.todayAppointments')}
              <Badge variant="secondary">{todayAppointments.length}</Badge>
            </CardTitle>
            <CardAction>
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to="/dashboard/appointments">{t('sections.viewAll')}</Link>
              </Button>
            </CardAction>
          </CardHeader>
          <CardContent className="px-3">
            {todayAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noTodayAppointments')}</p>
            ) : (
              <ul className="space-y-2">
                {todayAppointments.slice(0, MAX_CARD_ITEMS).map(appointment => (
                  <li key={appointment.id}>
                    <p className="truncate text-sm">{appointment.customerName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatTime(appointment.startDatetime)} - {formatTime(appointment.endDatetime)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.pendingAppointments')}
              <Badge variant="secondary">{pendingAppointments.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="px-3">
            {pendingAppointments.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noPending')}</p>
            ) : (
              <ul className="space-y-2">
                {pendingAppointments.slice(0, MAX_CARD_ITEMS).map(appointment => (
                  <li key={appointment.id}>
                    <p className="truncate text-sm">
                      {appointment.customerName} - {appointment.serviceName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatShortDate(appointment.startDatetime.split('T')[0], locale)}{' '}
                      {formatTime(appointment.startDatetime)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
        <Card className="flex flex-col gap-0 py-3">
          <CardHeader className="items-center px-3 pb-2">
            <CardTitle className="flex items-center gap-2 text-sm font-medium">
              {t('overview.activeTimeBlocks')}
              <Badge variant="secondary">{timeBlocks.length}</Badge>
            </CardTitle>
            <CardAction className="flex items-center gap-1">
              <Button variant="link" size="sm" className="h-auto p-0 text-xs" asChild>
                <Link to="/dashboard/time-blocks">{t('sections.viewAll')}</Link>
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={() => setIsTimeBlockDialogOpen(true)}
                      data-testid="dashboard-create-time-block"
                    >
                      <Plus className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>{t('sections.newTimeBlock')}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </CardAction>
          </CardHeader>
          <CardContent className="px-3">
            {timeBlocks.length === 0 ? (
              <p className="text-sm text-muted-foreground">{t('sections.noTimeBlocks')}</p>
            ) : (
              <ul className="space-y-2">
                {timeBlocks.slice(0, MAX_CARD_ITEMS).map(block => (
                  <li key={block.id}>
                    <p className="text-sm">{formatShortDate(block.date, locale)}</p>
                    <p className="text-xs text-muted-foreground">
                      {block.startTime.slice(0, 5)} - {block.endTime.slice(0, 5)}
                    </p>
                    {block.reason ? <p className="truncate text-xs text-muted-foreground">{block.reason}</p> : null}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
      <CalendarView appointments={appointments} timeBlocks={timeBlocks} />
      <ServiceFormDialog
        mode="create"
        isOpen={isCreateServiceOpen}
        onClose={() => setIsCreateServiceOpen(false)}
        onSubmit={handleCreateServiceSubmit}
      />
      {editingService ? (
        <ServiceFormDialog
          mode="edit"
          isOpen={true}
          onClose={() => setEditingService(null)}
          onSubmit={handleEditServiceSubmit}
          service={{
            name: editingService.name,
            description: editingService.description ?? '',
            durationMinutes: editingService.durationMinutes,
            price: editingService.price ?? '',
          }}
        />
      ) : null}
      {scheduleService ? (
        <ScheduleDialog
          serviceId={scheduleService.id}
          serviceName={scheduleService.name}
          isOpen={true}
          onClose={() => setScheduleService(null)}
        />
      ) : null}
      <TimeBlockFormDialog
        isOpen={isTimeBlockDialogOpen}
        onClose={() => setIsTimeBlockDialogOpen(false)}
        onSubmit={handleCreateTimeBlock}
      />
    </div>
  )
}

export default Component
