import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
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
  return hasPermission(currentRole, 'member', 'delete')
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
    <div className="grid gap-4" data-testid="member-list">
      {members.map(member => (
        <Card key={member.id} className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar>
                <AvatarFallback delayMs={0} className="bg-primary/10 text-primary">
                  {(member.user.name ?? member.user.email ?? '?').charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="flex items-center gap-1.5 text-sm font-medium">
                  {member.user.name ?? t('unknownMember')}
                </p>
                <div className="text-xs text-muted-foreground">
                  {member.user.email ? <p>{member.user.email}</p> : null}
                  {member.user.phoneNumber ? <p>{member.user.phoneNumber}</p> : null}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {member.userId === currentUserId ? <Badge>{t('me')}</Badge> : null}
              <Badge variant={ROLE_VARIANT[member.role] ?? 'outline'}>
                {t(`roles.${member.role}` as 'roles.owner')}
              </Badge>
              {canRemoveMember(currentUserRole, member.role, currentUserId, member.userId) ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onRemove(member)}
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 hover:text-destructive"
                        data-testid={`remove-member-${member.id}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>{t('actions.remove')}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : null}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
