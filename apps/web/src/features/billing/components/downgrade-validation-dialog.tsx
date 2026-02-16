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
import { useTranslation } from 'react-i18next'
import type { DowngradeValidation } from '../hooks/use-validate-downgrade'

interface DowngradeValidationDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  onRetry: () => void
  isLoading: boolean
  isValidating: boolean
  validation: DowngradeValidation | null
  error: string | null
}

export function DowngradeValidationDialog({
  isOpen,
  onClose,
  onConfirm,
  onRetry,
  isLoading,
  isValidating,
  validation,
  error,
}: DowngradeValidationDialogProps) {
  const { t } = useTranslation('billing')
  const canDowngrade = validation?.canDowngrade ?? false
  const exceeded = validation?.exceeded ?? []
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="downgrade-validation-dialog"
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {!isValidating && !canDowngrade && !error ? (
              <AlertTriangle className="h-5 w-5 text-destructive" aria-hidden="true" />
            ) : null}
            {t('subscription.downgradeDialog.title')}
          </DialogTitle>
          <DialogDescription>
            {isValidating
              ? t('subscription.downgradeDialog.validating')
              : error
                ? t('subscription.downgradeDialog.error')
                : canDowngrade
                  ? t('subscription.downgradeDialog.canDowngrade')
                  : t('subscription.downgradeDialog.cannotDowngrade')}
          </DialogDescription>
        </DialogHeader>
        {isValidating ? (
          <div className="flex items-center justify-center py-8" data-testid="downgrade-validating">
            <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
          </div>
        ) : error ? (
          <div className="space-y-3" data-testid="downgrade-error">
            <div className="rounded-md bg-destructive/10 p-4" role="alert">
              <p className="text-sm text-destructive">{t('subscription.downgradeDialog.errorMessage')}</p>
            </div>
            <Button variant="outline" onClick={onRetry} className="w-full" data-testid="downgrade-retry-button">
              {t('subscription.downgradeDialog.retry')}
            </Button>
          </div>
        ) : !canDowngrade && exceeded.length > 0 ? (
          <div className="space-y-4 py-2">
            <div
              className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900/20"
              role="alert"
              data-testid="downgrade-exceeded"
            >
              <p className="mb-3 text-sm font-medium text-yellow-800 dark:text-yellow-200">
                {t('subscription.downgradeDialog.reduceResources')}
              </p>
              <ul className="space-y-2">
                {exceeded.map(item => (
                  <li
                    key={item.resource}
                    className="flex items-center gap-2 text-sm text-yellow-800 dark:text-yellow-200"
                  >
                    <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>
                      {t(
                        `subscription.downgradeDialog.exceeded.${item.resource}` as 'subscription.downgradeDialog.exceeded.members',
                        { current: item.current, limit: item.limit },
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : canDowngrade ? (
          <div className="py-2" data-testid="downgrade-allowed">
            <p className="text-sm text-muted-foreground">{t('subscription.downgradeDialog.confirmMessage')}</p>
          </div>
        ) : null}
        <DialogFooter>
          <Button
            variant="outline"
            onClick={onClose}
            disabled={isLoading || isValidating}
            data-testid="downgrade-cancel-button"
          >
            {canDowngrade && !isValidating && !error
              ? t('subscription.downgradeDialog.cancel')
              : t('subscription.downgradeDialog.close')}
          </Button>
          {canDowngrade && !isValidating && !error ? (
            <Button onClick={onConfirm} disabled={isLoading} data-testid="downgrade-confirm-button">
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span>{t('subscription.downgradeDialog.loading')}</span>
                </>
              ) : (
                t('subscription.downgradeDialog.continueToPortal')
              )}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
