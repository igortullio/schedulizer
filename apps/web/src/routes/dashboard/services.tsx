import {
  Alert,
  AlertDescription,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import { Loader2, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscriptionContext } from '@/contexts/subscription-context'
import { ScheduleDialog } from '@/features/schedules/components/schedule-dialog'
import { ServiceCard, useServices } from '@/features/services'
import { ServiceFormDialog } from '@/features/services/components/service-form-dialog'

interface EditingService {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
}

export function Component() {
  const { t } = useTranslation('services')
  const { t: tCommon } = useTranslation('common')
  const { hasActiveSubscription, isLoading: isSubscriptionLoading } = useSubscriptionContext()
  const { services, state, error, createService, updateService, deleteService, toggleActive } = useServices()
  const isLoading = state === 'loading'
  const [isCreateOpen, setIsCreateOpen] = useState(false)
  const [editingService, setEditingService] = useState<EditingService | null>(null)
  const [scheduleService, setScheduleService] = useState<{ id: string; name: string } | null>(null)
  const isBlocked = !isSubscriptionLoading && !hasActiveSubscription
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
  async function handleCreateSubmit(data: { name: string; description?: string; duration: number; price: string }) {
    const created = await createService(data)
    setIsCreateOpen(false)
    if (created) {
      setScheduleService({ id: created.id, name: created.name })
    }
  }
  async function handleEditSubmit(data: { name: string; description?: string; duration: number; price: string }) {
    if (!editingService) return
    await updateService(editingService.id, data)
    setEditingService(null)
  }
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button onClick={() => setIsCreateOpen(true)} disabled={isBlocked} data-testid="create-service-button">
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('actions.create')}
                </Button>
              </span>
            </TooltipTrigger>
            {isBlocked ? <TooltipContent>{tCommon('subscription.banner.message')}</TooltipContent> : null}
          </Tooltip>
        </TooltipProvider>
      </div>
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      ) : error && !isBlocked ? (
        <Alert variant="destructive" className="border-0 bg-destructive/10 text-center" data-testid="error-message">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : services.length === 0 ? (
        <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-state">
          <p className="text-muted-foreground">{t('emptyState')}</p>
          {!isBlocked ? (
            <Button onClick={() => setIsCreateOpen(true)} variant="outline" className="mt-4">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('actions.createFirst')}
            </Button>
          ) : null}
        </div>
      ) : (
        <div className="grid gap-4" data-testid="services-list">
          {services.map(service => (
            <ServiceCard
              key={service.id}
              id={service.id}
              name={service.name}
              description={service.description}
              durationMinutes={service.durationMinutes}
              price={service.price}
              active={service.active}
              onEdit={handleEditService}
              onDelete={handleDeleteService}
              onToggleActive={handleToggleActive}
              onSchedule={handleSchedule}
            />
          ))}
        </div>
      )}
      <ServiceFormDialog
        mode="create"
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreateSubmit}
      />
      {editingService ? (
        <ServiceFormDialog
          mode="edit"
          isOpen={true}
          onClose={() => setEditingService(null)}
          onSubmit={handleEditSubmit}
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
    </div>
  )
}

export default Component
