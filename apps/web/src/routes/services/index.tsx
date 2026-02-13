import { Button } from '@igortullio-ui/react'
import { ArrowLeft, Loader2, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { ServiceCard, useServices } from '@/features/services'
import { useSession } from '@/lib/auth-client'

export function Component() {
  const { t } = useTranslation('services')
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { services, state, error, deleteService, toggleActive } = useServices()
  const isLoading = state === 'loading'
  function handleBackToDashboard() {
    navigate('/dashboard')
  }
  function handleCreateService() {
    navigate('/services/new')
  }
  function handleEditService(id: string) {
    navigate(`/services/${id}/edit`)
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
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <Button variant="ghost" onClick={handleBackToDashboard} data-testid="back-button">
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t('backToDashboard')}
          </Button>
        </div>
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
            <p className="mt-2 text-muted-foreground">{t('description')}</p>
          </div>
          <Button onClick={handleCreateService} data-testid="create-service-button">
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('actions.create')}
          </Button>
        </div>
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="rounded-md bg-destructive/10 p-4 text-center text-destructive" data-testid="error-message">
            {error}
          </div>
        ) : services.length === 0 ? (
          <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-state">
            <p className="text-muted-foreground">{t('emptyState')}</p>
            <Button onClick={handleCreateService} variant="outline" className="mt-4">
              <Plus className="h-4 w-4" aria-hidden="true" />
              {t('actions.createFirst')}
            </Button>
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
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Component
