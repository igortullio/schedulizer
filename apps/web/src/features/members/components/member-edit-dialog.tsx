import {
  Alert,
  AlertDescription,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
} from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { Member } from '../hooks/use-members'

interface MemberEditDialogProps {
  isOpen: boolean
  member: Member | null
  error: string | null
  onClose: () => void
  onSubmit: (userId: string, data: { email?: string; phoneNumber?: string }) => Promise<void>
}

export function MemberEditDialog({ isOpen, member, error, onClose, onSubmit }: MemberEditDialogProps) {
  const { t } = useTranslation('members')
  const { t: tCommon } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  useEffect(() => {
    if (member) {
      setEmail(member.user.email ?? '')
      setPhoneNumber(member.user.phoneNumber ?? '')
    }
  }, [member])
  function handleClose() {
    onClose()
  }
  function hasChanges(): boolean {
    if (!member) return false
    const originalEmail = member.user.email ?? ''
    const originalPhone = member.user.phoneNumber ?? ''
    return email.trim() !== originalEmail || phoneNumber.trim() !== originalPhone
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!member || !hasChanges()) return
    setIsSubmitting(true)
    try {
      const data: { email?: string; phoneNumber?: string } = {}
      const originalEmail = member.user.email ?? ''
      const originalPhone = member.user.phoneNumber ?? ''
      if (email.trim() !== originalEmail) data.email = email.trim()
      if (phoneNumber.trim() !== originalPhone) data.phoneNumber = phoneNumber.trim()
      await onSubmit(member.userId, data)
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="member-edit-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('editDialog.title')}</DialogTitle>
          <DialogDescription>{t('editDialog.description')}</DialogDescription>
        </DialogHeader>
        {error ? (
          <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="edit-error">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-email">{t('editDialog.emailLabel')}</Label>
            <Input
              id="edit-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('editDialog.emailPlaceholder')}
              data-testid="edit-email-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-phone">{t('editDialog.phoneLabel')}</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder={t('editDialog.phonePlaceholder')}
              data-testid="edit-phone-input"
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="cancel-edit-button"
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !hasChanges()} data-testid="submit-edit-button">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span>{t('editDialog.saving')}</span>
                </>
              ) : (
                t('editDialog.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
