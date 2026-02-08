import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@schedulizer/ui'
import { AlertTriangle, Loader2 } from 'lucide-react'

interface CancelSubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  periodEnd: string | null
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'the end of the current period'
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  periodEnd,
}: CancelSubscriptionDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="cancel-subscription-dialog">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>Are you sure you want to cancel your subscription?</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              Your subscription will remain active until <strong>{formatDate(periodEnd)}</strong>. After this date, you
              will lose access to premium features.
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            You can reactivate your subscription at any time before the cancellation takes effect.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="keep-subscription-button">
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} data-testid="confirm-cancel-button">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Canceling...</span>
              </>
            ) : (
              'Cancel Subscription'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
