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
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface CancelInvitationDialogProps {
  isOpen: boolean
  email: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function CancelInvitationDialog({ isOpen, email, onClose, onConfirm }: CancelInvitationDialogProps) {
  const { t } = useTranslation('members')
  const { t: tCommon } = useTranslation('common')
  const [isCancelling, setIsCancelling] = useState(false)
  async function handleConfirm() {
    setIsCancelling(true)
    try {
      await onConfirm()
    } finally {
      setIsCancelling(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="cancel-invitation-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('cancelInvitationDialog.title')}</DialogTitle>
          <DialogDescription>{t('cancelInvitationDialog.description', { email })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCancelling} data-testid="cancel-dialog-button">
            {tCommon('buttons.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isCancelling}
            data-testid="confirm-cancel-invitation-button"
          >
            {isCancelling ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('cancelInvitationDialog.cancelling')}</span>
              </>
            ) : (
              t('cancelInvitationDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
