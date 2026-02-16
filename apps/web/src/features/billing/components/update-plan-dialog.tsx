import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface UpdatePlanDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
}

export function UpdatePlanDialog({ isOpen, onClose, onConfirm, isLoading }: UpdatePlanDialogProps) {
  const { t } = useTranslation('billing')
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="update-plan-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('subscription.updatePlanDialog.title')}</DialogTitle>
          <DialogDescription>{t('subscription.updatePlanDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <p className="text-sm text-muted-foreground">{t('subscription.updatePlanDialog.portalInfo')}</p>
          <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-muted-foreground">
            <li>{t('subscription.updatePlanDialog.portalFeatures.upgrade')}</li>
            <li>{t('subscription.updatePlanDialog.portalFeatures.switchBilling')}</li>
            <li>{t('subscription.updatePlanDialog.portalFeatures.viewPricing')}</li>
          </ul>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="cancel-update-button">
            {t('buttons.cancel', { ns: 'common' })}
          </Button>
          <Button onClick={onConfirm} disabled={isLoading} data-testid="confirm-update-button">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Loading...</span>
              </>
            ) : (
              t('subscription.updatePlanDialog.continueToPortal')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
