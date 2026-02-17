import { Navigate, Outlet } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import type { Role } from '@/lib/permissions'

interface RoleGuardProps {
  allowedRoles: Role[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { data: activeMember } = authClient.useActiveMember()
  const role = (activeMember?.role ?? 'member') as Role
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
