import { Alert, AlertDescription, Button, Dialog, DialogContent, DialogHeader, DialogTitle } from '@igortullio-ui/react'
import { useTranslation } from 'react-i18next'

interface ConflictingAppointment {
  id: string
  customerName: string
  startDatetime: string
  endDatetime: string
}

interface ConflictDialogProps {
  isOpen: boolean
  conflictingAppointments: ConflictingAppointment[]
  onConfirm: () => void
  onCancel: () => void
}

function formatTime(datetime: string): string {
  const date = new Date(datetime)
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function formatDate(datetime: string): string {
  const date = new Date(datetime)
  return date.toLocaleDateString()
}

export function ConflictDialog({ isOpen, conflictingAppointments, onConfirm, onCancel }: ConflictDialogProps) {
  const { t } = useTranslation('appointments')
  return (
    <Dialog open={isOpen} onOpenChange={(open: boolean) => !open && onCancel()}>
      <DialogContent data-testid="conflict-dialog">
        <DialogHeader>
          <DialogTitle>{t('conflict.title')}</DialogTitle>
        </DialogHeader>
        <Alert variant="destructive" className="border-0 bg-destructive/10">
          <AlertDescription>{t('conflict.description')}</AlertDescription>
        </Alert>
        <ul className="space-y-2" data-testid="conflict-list">
          {conflictingAppointments.map(appointment => (
            <li key={appointment.id} className="rounded-md border p-3 text-sm" data-testid="conflict-item">
              <p className="font-medium">{appointment.customerName}</p>
              <p className="text-muted-foreground">
                {formatDate(appointment.startDatetime)} {formatTime(appointment.startDatetime)} –{' '}
                {formatTime(appointment.endDatetime)}
              </p>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onCancel} data-testid="conflict-cancel">
            {t('conflict.cancel')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} data-testid="conflict-confirm">
            {t('conflict.confirm')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
