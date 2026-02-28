import { clientEnv } from '@schedulizer/env/client'
import { useCallback, useEffect, useState } from 'react'
import { authClient } from '@/lib/auth-client'

export interface Member {
  id: string
  userId: string
  organizationId: string
  role: string
  createdAt: Date
  user: {
    id: string
    name: string | null
    email: string | null
    phoneNumber?: string | null
    image?: string | undefined
  }
}

export interface Invitation {
  id: string
  email: string
  role: string
  status: string
  expiresAt: Date
  organizationId: string
  inviterId: string
}

type FetchState = 'loading' | 'success' | 'error'

interface UseMembersReturn {
  members: Member[]
  invitations: Invitation[]
  membersState: FetchState
  invitationsState: FetchState
  membersError: string | null
  invitationsError: string | null
  refetchMembers: () => Promise<void>
  refetchInvitations: () => Promise<void>
}

export function useMembers(): UseMembersReturn {
  const [members, setMembers] = useState<Member[]>([])
  const [invitations, setInvitations] = useState<Invitation[]>([])
  const [membersState, setMembersState] = useState<FetchState>('loading')
  const [invitationsState, setInvitationsState] = useState<FetchState>('loading')
  const [membersError, setMembersError] = useState<string | null>(null)
  const [invitationsError, setInvitationsError] = useState<string | null>(null)
  const fetchMembers = useCallback(async () => {
    setMembersState('loading')
    setMembersError(null)
    try {
      const response = await fetch(`${clientEnv.apiUrl}/api/members`, {
        method: 'GET',
        credentials: 'include',
      })
      if (!response.ok) {
        throw new Error('Failed to fetch members')
      }
      const json = (await response.json()) as { data: Member[] }
      setMembers(json.data)
      setMembersState('success')
    } catch (err) {
      console.error('Failed to fetch members', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setMembersError(err instanceof Error ? err.message : 'Failed to fetch members')
      setMembersState('error')
    }
  }, [])
  const fetchInvitations = useCallback(async () => {
    setInvitationsState('loading')
    setInvitationsError(null)
    try {
      const response = await authClient.organization.listInvitations()
      if (response.error) {
        throw new Error(response.error.message ?? 'Failed to fetch invitations')
      }
      const rawInvitations = (response.data ?? []) as Array<Record<string, unknown>>
      setInvitations(
        rawInvitations.map(inv => ({
          ...inv,
          expiresAt: new Date(inv.expiresAt as string | Date),
        })) as Invitation[],
      )
      setInvitationsState('success')
    } catch (err) {
      console.error('Failed to fetch invitations', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setInvitationsError(err instanceof Error ? err.message : 'Failed to fetch invitations')
      setInvitationsState('error')
    }
  }, [])
  useEffect(() => {
    fetchMembers()
    fetchInvitations()
  }, [fetchMembers, fetchInvitations])
  return {
    members,
    invitations,
    membersState,
    invitationsState,
    membersError,
    invitationsError,
    refetchMembers: fetchMembers,
    refetchInvitations: fetchInvitations,
  }
}
