import { Badge, Button, Card, CardContent } from '@igortullio-ui/react'
import { RotateCw, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Invitation } from '../hooks/use-members'

interface InvitationListProps {
  invitations: Invitation[]
  onCancel: (invitation: Invitation) => void
  onResend: (invitation: Invitation) => void
}

function computeDaysUntilExpiration(expiresAt: Date): number {
  const diffMs = expiresAt.getTime() - Date.now()
  return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
}

function isExpired(expiresAt: Date): boolean {
  return expiresAt.getTime() < Date.now()
}

export function InvitationList({ invitations, onCancel, onResend }: InvitationListProps) {
  const { t } = useTranslation('members')
  const pendingInvitations = invitations.filter(inv => inv.status === 'pending')
  if (pendingInvitations.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-invitations">
        <p className="text-muted-foreground">{t('emptyInvitations')}</p>
      </div>
    )
  }
  return (
    <div className="space-y-3" data-testid="invitation-list">
      {pendingInvitations.map(invitation => {
        const expired = isExpired(invitation.expiresAt)
        const daysLeft = computeDaysUntilExpiration(invitation.expiresAt)
        return (
          <Card key={invitation.id}>
            <CardContent className="flex items-center justify-between py-3">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted text-sm font-medium text-muted-foreground">
                  {invitation.email.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{invitation.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {expired ? t('invitation.expired') : t('invitation.expiresIn', { days: daysLeft })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{t(`roles.${invitation.role}` as 'roles.member')}</Badge>
                {expired ? (
                  <Badge variant="destructive">{t('invitation.expired')}</Badge>
                ) : (
                  <Badge variant="secondary">{t('invitation.pending')}</Badge>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onResend(invitation)}
                  className="h-8 w-8"
                  title={t('actions.resend')}
                  data-testid={`resend-invitation-${invitation.id}`}
                >
                  <RotateCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onCancel(invitation)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  title={t('actions.cancel')}
                  data-testid={`cancel-invitation-${invitation.id}`}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
