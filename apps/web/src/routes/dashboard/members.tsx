import {
  Alert,
  AlertDescription,
  Button,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import { Loader2, Plus } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSubscriptionContext } from '@/contexts/subscription-context'
import { PlanLimitBanner, UsageIndicator } from '@/features/billing'
import type { Invitation, Member } from '@/features/members'
import {
  CancelInvitationDialog,
  InvitationList,
  InviteMemberDialog,
  MemberList,
  RemoveMemberDialog,
  useMemberActions,
  useMembers,
} from '@/features/members'
import { authClient } from '@/lib/auth-client'
import type { Role } from '@/lib/permissions'

export function Component() {
  const { t } = useTranslation('members')
  const { t: tCommon } = useTranslation('common')
  const {
    usage,
    incrementUsage,
    decrementUsage,
    hasActiveSubscription,
    isLoading: isSubscriptionLoading,
  } = useSubscriptionContext()
  const { data: session } = authClient.useSession()
  const { data: activeOrg } = authClient.useActiveOrganization()
  const { data: activeMember } = authClient.useActiveMember()
  const currentUserRole = (activeMember?.role ?? 'member') as Role
  const currentUserId = session?.user?.id ?? ''
  const organizationId = activeOrg?.id ?? ''
  const {
    members,
    invitations,
    membersState,
    invitationsState,
    membersError,
    invitationsError,
    refetchMembers,
    refetchInvitations,
  } = useMembers()
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false)
  const [memberToRemove, setMemberToRemove] = useState<Member | null>(null)
  const [invitationToCancel, setInvitationToCancel] = useState<Invitation | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const handleInviteSuccess = useCallback(() => {
    refetchInvitations()
    refetchMembers()
    incrementUsage('members')
    setSuccessMessage(t('success.invite'))
    setIsInviteDialogOpen(false)
  }, [refetchInvitations, refetchMembers, incrementUsage, t])
  const handleRemoveSuccess = useCallback(() => {
    refetchMembers()
    decrementUsage('members')
    setSuccessMessage(t('success.remove'))
    setMemberToRemove(null)
  }, [refetchMembers, decrementUsage, t])
  const handleCancelSuccess = useCallback(() => {
    refetchInvitations()
    setSuccessMessage(t('success.cancel'))
    setInvitationToCancel(null)
  }, [refetchInvitations, t])
  const handleResendSuccess = useCallback(() => {
    refetchInvitations()
    setSuccessMessage(t('success.resend'))
  }, [refetchInvitations, t])
  const { inviteMember, removeMember, cancelInvitation, resendInvitation } = useMemberActions({
    onInviteSuccess: handleInviteSuccess,
    onRemoveSuccess: handleRemoveSuccess,
    onCancelSuccess: handleCancelSuccess,
    onResendSuccess: handleResendSuccess,
  })
  const canAddMembers = usage?.members.canAdd ?? true
  const isBlocked = !isSubscriptionLoading && !hasActiveSubscription
  async function handleInviteSubmit(email: string, role: 'admin' | 'member') {
    setActionError(null)
    setSuccessMessage(null)
    try {
      await inviteMember({ email, role, organizationId })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.invite'))
      throw err
    }
  }
  async function handleRemoveConfirm() {
    if (!memberToRemove) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await removeMember(memberToRemove.userId)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.remove'))
    }
  }
  async function handleCancelConfirm() {
    if (!invitationToCancel) return
    setActionError(null)
    setSuccessMessage(null)
    try {
      await cancelInvitation(invitationToCancel.id)
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.cancel'))
    }
  }
  async function handleResend(invitation: Invitation) {
    setActionError(null)
    setSuccessMessage(null)
    try {
      await resendInvitation({
        invitationId: invitation.id,
        email: invitation.email,
        role: invitation.role as 'admin' | 'member',
        organizationId,
      })
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t('errors.resend'))
    }
  }
  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">{t('title')}</h1>
          <p className="mt-2 text-muted-foreground">{t('description')}</p>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <span>
                <Button
                  onClick={() => setIsInviteDialogOpen(true)}
                  disabled={isBlocked || !canAddMembers}
                  data-testid="invite-member-button"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {t('actions.invite')}
                </Button>
              </span>
            </TooltipTrigger>
            {isBlocked ? <TooltipContent>{tCommon('subscription.banner.message')}</TooltipContent> : null}
            {!isBlocked && !canAddMembers ? <TooltipContent>{t('errors.planLimit')}</TooltipContent> : null}
          </Tooltip>
        </TooltipProvider>
      </div>
      {actionError ? (
        <Alert variant="destructive" className="mb-4 border-0 bg-destructive/10" data-testid="action-error">
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {successMessage ? (
        <Alert
          className="mb-4 border-0 bg-green-500/10 text-green-700 dark:text-green-400"
          data-testid="action-success"
        >
          <AlertDescription>{successMessage}</AlertDescription>
        </Alert>
      ) : null}
      {usage?.members ? (
        <div className="mb-6 space-y-3">
          <div className="w-48">
            <UsageIndicator resource="members" usage={usage.members} />
          </div>
          {!usage.members.canAdd && usage.members.limit !== null ? (
            <PlanLimitBanner resource="members" current={usage.members.current} limit={usage.members.limit} />
          ) : null}
        </div>
      ) : null}
      <div className="space-y-8">
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">{t('sections.members')}</h2>
          {membersState === 'loading' ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : membersError ? (
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="members-error">
              <AlertDescription>{t('errors.fetchMembers')}</AlertDescription>
            </Alert>
          ) : (
            <MemberList
              members={members}
              currentUserId={currentUserId}
              currentUserRole={currentUserRole}
              onRemove={setMemberToRemove}
            />
          )}
        </div>
        <div>
          <h2 className="mb-4 text-xl font-semibold tracking-tight text-foreground">{t('sections.invitations')}</h2>
          {invitationsState === 'loading' ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
            </div>
          ) : invitationsError ? (
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="invitations-error">
              <AlertDescription>{t('errors.fetchInvitations')}</AlertDescription>
            </Alert>
          ) : (
            <InvitationList invitations={invitations} onCancel={setInvitationToCancel} onResend={handleResend} />
          )}
        </div>
      </div>
      <InviteMemberDialog
        isOpen={isInviteDialogOpen}
        onClose={() => setIsInviteDialogOpen(false)}
        onSubmit={handleInviteSubmit}
      />
      <RemoveMemberDialog
        isOpen={memberToRemove !== null}
        memberName={memberToRemove?.user.name ?? memberToRemove?.user.email ?? ''}
        onClose={() => setMemberToRemove(null)}
        onConfirm={handleRemoveConfirm}
      />
      <CancelInvitationDialog
        isOpen={invitationToCancel !== null}
        email={invitationToCancel?.email ?? ''}
        onClose={() => setInvitationToCancel(null)}
        onConfirm={handleCancelConfirm}
      />
    </div>
  )
}

export default Component
