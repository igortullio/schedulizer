import { Button, Card, CardContent } from '@igortullio-ui/react'
import { Calendar, Clock, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface TimeBlockCardProps {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string | null
  onDelete: (id: string) => void
}

export function TimeBlockCard({ id, date, startTime, endTime, reason, onDelete }: TimeBlockCardProps) {
  const { t } = useTranslation('timeBlocks')
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString()
  return (
    <Card data-testid={`time-block-card-${id}`}>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>{formattedDate}</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <span>
              {startTime} - {endTime}
            </span>
          </div>
          {reason ? <span className="text-sm text-muted-foreground">({reason})</span> : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(id)}
          className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          data-testid={`delete-time-block-${id}`}
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          {t('actions.delete')}
        </Button>
      </CardContent>
    </Card>
  )
}
