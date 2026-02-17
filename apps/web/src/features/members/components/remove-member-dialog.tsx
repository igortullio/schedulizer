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

interface RemoveMemberDialogProps {
  isOpen: boolean
  memberName: string
  onClose: () => void
  onConfirm: () => Promise<void>
}

export function RemoveMemberDialog({ isOpen, memberName, onClose, onConfirm }: RemoveMemberDialogProps) {
  const { t } = useTranslation('members')
  const { t: tCommon } = useTranslation('common')
  const [isRemoving, setIsRemoving] = useState(false)
  async function handleConfirm() {
    setIsRemoving(true)
    try {
      await onConfirm()
    } finally {
      setIsRemoving(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="remove-member-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('removeDialog.title')}</DialogTitle>
          <DialogDescription>{t('removeDialog.description', { name: memberName })}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isRemoving} data-testid="cancel-remove-button">
            {tCommon('buttons.cancel')}
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isRemoving}
            data-testid="confirm-remove-button"
          >
            {isRemoving ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('removeDialog.removing')}</span>
              </>
            ) : (
              t('removeDialog.confirm')
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
