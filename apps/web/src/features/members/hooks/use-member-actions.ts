import { useCallback } from 'react'
import { authClient } from '@/lib/auth-client'

interface UseMemberActionsParams {
  onInviteSuccess: () => void
  onRemoveSuccess: () => void
  onCancelSuccess: () => void
  onResendSuccess: () => void
}

interface InviteMemberData {
  email: string
  role: 'admin' | 'member'
  organizationId: string
}

interface ResendInvitationData {
  invitationId: string
  email: string
  role: 'admin' | 'member'
  organizationId: string
}

export function useMemberActions({
  onInviteSuccess,
  onRemoveSuccess,
  onCancelSuccess,
  onResendSuccess,
}: UseMemberActionsParams) {
  const inviteMember = useCallback(
    async (data: InviteMemberData) => {
      const response = await authClient.organization.inviteMember({
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to invite member')
      }
      onInviteSuccess()
      return response.data
    },
    [onInviteSuccess],
  )
  const removeMember = useCallback(
    async (memberIdOrEmail: string) => {
      const response = await authClient.organization.removeMember({
        memberIdOrEmail,
      })
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to remove member')
      }
      onRemoveSuccess()
      return response.data
    },
    [onRemoveSuccess],
  )
  const cancelInvitation = useCallback(
    async (invitationId: string) => {
      const response = await authClient.organization.cancelInvitation({
        invitationId,
      })
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to cancel invitation')
      }
      onCancelSuccess()
      return response.data
    },
    [onCancelSuccess],
  )
  const resendInvitation = useCallback(
    async (data: ResendInvitationData) => {
      const cancelResponse = await authClient.organization.cancelInvitation({
        invitationId: data.invitationId,
      })
      if (cancelResponse.error) {
        throw new Error(cancelResponse.error.message ?? 'Failed to cancel invitation')
      }
      const inviteResponse = await authClient.organization.inviteMember({
        email: data.email,
        role: data.role,
        organizationId: data.organizationId,
      })
      if (inviteResponse.error) {
        throw new Error(inviteResponse.error.message ?? 'Failed to resend invitation')
      }
      onResendSuccess()
      return inviteResponse.data
    },
    [onResendSuccess],
  )
  return {
    inviteMember,
    removeMember,
    cancelInvitation,
    resendInvitation,
  }
}
