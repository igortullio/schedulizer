import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@schedulizer/ui'
import { Loader2 } from 'lucide-react'

interface UpdatePlanDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function UpdatePlanDialog({ isOpen, onClose, onConfirm, isLoading }: UpdatePlanDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent data-testid="update-plan-dialog">
        <DialogHeader>
          <DialogTitle>Change Subscription Plan</DialogTitle>
          <DialogDescription>
            You will be redirected to the Stripe Customer Portal to manage your subscription and change your plan.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">In the Customer Portal, you can:</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>Upgrade or downgrade your plan</li>
            <li>Switch between monthly and yearly billing</li>
            <li>View plan features and pricing</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="cancel-update-button">
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} data-testid="confirm-update-button">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Loading...</span>
              </>
            ) : (
              'Continue to Portal'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
