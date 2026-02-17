import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@igortullio-ui/react'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'

interface InviteMemberDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (email: string, role: 'admin' | 'member') => Promise<void>
}

export function InviteMemberDialog({ isOpen, onClose, onSubmit }: InviteMemberDialogProps) {
  const { t } = useTranslation('members')
  const { t: tCommon } = useTranslation('common')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<'admin' | 'member'>('member')
  const [isSubmitting, setIsSubmitting] = useState(false)
  function handleClose() {
    setEmail('')
    setRole('member')
    onClose()
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) return
    setIsSubmitting(true)
    try {
      await onSubmit(email.trim(), role)
      setEmail('')
      setRole('member')
    } finally {
      setIsSubmitting(false)
    }
  }
  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="max-h-screen overflow-y-auto max-sm:h-full max-sm:max-w-full max-sm:rounded-none max-sm:border-0"
        data-testid="invite-member-dialog"
      >
        <DialogHeader>
          <DialogTitle>{t('inviteDialog.title')}</DialogTitle>
          <DialogDescription>{t('inviteDialog.description')}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="invite-email">{t('inviteDialog.emailLabel')}</Label>
            <Input
              id="invite-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder={t('inviteDialog.emailPlaceholder')}
              required
              data-testid="invite-email-input"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="invite-role">{t('inviteDialog.roleLabel')}</Label>
            <Select value={role} onValueChange={(value: string) => setRole(value as 'admin' | 'member')}>
              <SelectTrigger data-testid="invite-role-select">
                <SelectValue placeholder={t('inviteDialog.selectRole')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="member">{t('roles.member')}</SelectItem>
                <SelectItem value="admin">{t('roles.admin')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
              data-testid="cancel-invite-button"
            >
              {tCommon('buttons.cancel')}
            </Button>
            <Button type="submit" disabled={isSubmitting || !email.trim()} data-testid="submit-invite-button">
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" aria-hidden="true" />
                  <span>{t('inviteDialog.sending')}</span>
                </>
              ) : (
                t('inviteDialog.submit')
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
