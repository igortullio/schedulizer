import { Badge, Button, Card, CardContent } from '@igortullio-ui/react'
import { Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { Role } from '@/lib/permissions'
import { hasPermission } from '@/lib/permissions'
import type { Member } from '../hooks/use-members'

interface MemberListProps {
  members: Member[]
  currentUserId: string
  currentUserRole: Role
  onRemove: (member: Member) => void
}

const ROLE_VARIANT: Record<string, 'default' | 'secondary' | 'outline'> = {
  owner: 'default',
  admin: 'secondary',
  member: 'outline',
}

function canRemoveMember(currentRole: Role, targetRole: string, currentUserId: string, targetUserId: string): boolean {
  if (currentUserId === targetUserId) return false
  if (targetRole === 'owner') return false
  if (targetRole === 'admin' && currentRole !== 'owner') return false
  return hasPermission(currentRole, 'member', 'remove')
}

export function MemberList({ members, currentUserId, currentUserRole, onRemove }: MemberListProps) {
  const { t } = useTranslation('members')
  if (members.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-12 text-center" data-testid="empty-members">
        <p className="text-muted-foreground">{t('emptyState')}</p>
      </div>
    )
  }
  return (
    <div className="space-y-3" data-testid="member-list">
      {members.map(member => (
        <Card key={member.id}>
          <CardContent className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
                {(member.user.name ?? member.user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-medium">{member.user.name ?? member.user.email}</p>
                <p className="text-xs text-muted-foreground">{member.user.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={ROLE_VARIANT[member.role] ?? 'outline'}>
                {t(`roles.${member.role}` as 'roles.owner')}
              </Badge>
              {canRemoveMember(currentUserRole, member.role, currentUserId, member.userId) ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(member)}
                  className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                  data-testid={`remove-member-${member.id}`}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              ) : null}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
