import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from '@igortullio-ui/react'
import { Clock, DollarSign, Pencil, Power, Trash2 } from 'lucide-react'
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
}: ServiceCardProps) {
  const { t } = useTranslation('services')
  return (
    <Card data-testid={`service-card-${id}`}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div className="space-y-1">
          <CardTitle className="text-lg" data-testid="service-name">
            {name}
          </CardTitle>
          {description ? (
            <p className="text-sm text-muted-foreground" data-testid="service-description">
              {description}
            </p>
          ) : null}
        </div>
        <Badge variant={active ? 'default' : 'secondary'} data-testid="service-status">
          {active ? t('status.active') : t('status.inactive')}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1" data-testid="service-duration">
            <Clock className="h-4 w-4" aria-hidden="true" />
            <span>
              {durationMinutes} {t('minutes')}
            </span>
          </div>
          {price ? (
            <div className="flex items-center gap-1" data-testid="service-price">
              <DollarSign className="h-4 w-4" aria-hidden="true" />
              <span>R$ {price}</span>
            </div>
          ) : null}
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => onEdit(id)} data-testid="edit-service-button">
            <Pencil className="h-4 w-4" aria-hidden="true" />
            {t('actions.edit')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onToggleActive(id, !active)}
            data-testid="toggle-active-button"
          >
            <Power className="h-4 w-4" aria-hidden="true" />
            {active ? t('actions.deactivate') : t('actions.activate')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDelete(id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            data-testid="delete-service-button"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            {t('actions.delete')}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
