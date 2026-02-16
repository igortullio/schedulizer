import { Badge, Button, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@igortullio-ui/react'
import { Calendar, Clock, DollarSign, Pencil, Power, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface ServiceCardProps {
  id: string
  name: string
  description: string | null
  durationMinutes: number
  price: string | null
  active: boolean
  onEdit: (id: string) => void
  onDelete: (id: string) => void
  onToggleActive: (id: string, active: boolean) => void
  onSchedule?: (id: string) => void
}

export function ServiceCard({
  id,
  name,
  description,
  durationMinutes,
  price,
  active,
  onEdit,
  onDelete,
  onToggleActive,
  onSchedule,
}: ServiceCardProps) {
  const { t } = useTranslation('services')
  return (
    <Card className="px-4 py-3" data-testid={`service-card-${id}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate font-medium" data-testid="service-name">
              {name}
            </span>
            <Badge variant={active ? 'default' : 'secondary'} className="shrink-0" data-testid="service-status">
              {active ? t('status.active') : t('status.inactive')}
            </Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {description ? (
              <span className="truncate" data-testid="service-description">
                {description}
              </span>
            ) : null}
            <span className="flex shrink-0 items-center gap-1" data-testid="service-duration">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {durationMinutes} {t('minutes')}
            </span>
            {price ? (
              <span className="flex shrink-0 items-center gap-1" data-testid="service-price">
                <DollarSign className="h-3 w-3" aria-hidden="true" />
                R$ {price}
              </span>
            ) : null}
          </div>
        </div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center max-sm:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(id)}
                  data-testid="edit-service-button"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('actions.edit')}</TooltipContent>
            </Tooltip>
            {onSchedule ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onSchedule(id)}
                    data-testid="schedule-service-button"
                  >
                    <Calendar className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>{t('actions.schedule')}</TooltipContent>
              </Tooltip>
            ) : null}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onToggleActive(id, !active)}
                  data-testid="toggle-active-button"
                >
                  <Power className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{active ? t('actions.deactivate') : t('actions.activate')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(id)}
                  data-testid="delete-service-button"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('actions.delete')}</TooltipContent>
            </Tooltip>
          </div>
          <div className="flex shrink-0 items-center sm:hidden">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => onEdit(id)}
                  data-testid="edit-service-button-mobile"
                >
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('actions.edit')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
      <div className="mt-2 flex items-center gap-1 border-t pt-2 sm:hidden">
        {onSchedule ? (
          <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs" onClick={() => onSchedule(id)}>
            <Calendar className="h-3.5 w-3.5" aria-hidden="true" />
            {t('actions.schedule')}
          </Button>
        ) : null}
        <Button variant="ghost" size="sm" className="h-8 flex-1 text-xs" onClick={() => onToggleActive(id, !active)}>
          <Power className="h-3.5 w-3.5" aria-hidden="true" />
          {active ? t('actions.deactivate') : t('actions.activate')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 flex-1 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
          onClick={() => onDelete(id)}
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          {t('actions.delete')}
        </Button>
      </div>
    </Card>
  )
}
