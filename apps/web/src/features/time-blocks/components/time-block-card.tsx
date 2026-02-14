import { Button, Card, Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@igortullio-ui/react'
import { Clock, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { getLocale } from '@/lib/format'

interface TimeBlockCardProps {
  id: string
  date: string
  startTime: string
  endTime: string
  reason: string | null
  onDelete: (id: string) => void
}

export function TimeBlockCard({ id, date, startTime, endTime, reason, onDelete }: TimeBlockCardProps) {
  const { t, i18n } = useTranslation('timeBlocks')
  const formattedDate = new Date(`${date}T00:00:00`).toLocaleDateString(getLocale(i18n.language))
  return (
    <Card className="px-4 py-3" data-testid={`time-block-card-${id}`}>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium" data-testid="time-block-date">
              {formattedDate}
            </span>
          </div>
          <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="flex shrink-0 items-center gap-1">
              <Clock className="h-3 w-3" aria-hidden="true" />
              {startTime} - {endTime}
            </span>
            {reason ? <span className="truncate">{reason}</span> : null}
          </div>
        </div>
        <TooltipProvider>
          <div className="flex shrink-0 items-center">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => onDelete(id)}
                  data-testid={`delete-time-block-${id}`}
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{t('actions.delete')}</TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </Card>
  )
}
