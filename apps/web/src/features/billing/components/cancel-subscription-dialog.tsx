import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@igortullio-ui/react'
import { AlertTriangle, Loader2 } from 'lucide-react'
import { Trans, useTranslation } from 'react-i18next'
import { formatDate } from '@/lib/format'

interface CancelSubscriptionDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  isLoading: boolean
  periodEnd: string | null
}

export function CancelSubscriptionDialog({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  periodEnd,
}: CancelSubscriptionDialogProps) {
  const { t, i18n } = useTranslation('billing')
  const formattedDate = formatDate(periodEnd, i18n.language)
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="cancel-subscription-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            {t('subscription.cancelDialog.title')}
          </DialogTitle>
          <DialogDescription>{t('subscription.cancelDialog.description')}</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              {periodEnd ? (
                <Trans
                  i18nKey="subscription.cancelDialog.warning"
                  ns="billing"
                  values={{ date: formattedDate }}
                  components={{ strong: <strong /> }}
                />
              ) : (
                t('subscription.cancelDialog.warningFallback')
              )}
            </p>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">{t('subscription.cancelDialog.reactivateInfo')}</p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isLoading} data-testid="keep-subscription-button">
            {t('subscription.cancelDialog.keepSubscription')}
          </Button>
          <Button variant="destructive" onClick={onConfirm} disabled={isLoading} data-testid="confirm-cancel-button">
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('subscription.cancelDialog.canceling')}</span>
              </>
            ) : (
              t('subscription.cancelDialog.confirmCancel')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
