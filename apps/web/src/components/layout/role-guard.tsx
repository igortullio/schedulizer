import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import type { Role } from '@/lib/permissions'

interface RoleGuardProps {
  allowedRoles: Role[]
}

export function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { data: activeMember, isPending } = authClient.useActiveMember()
  if (isPending) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }
  const role = (activeMember?.role ?? 'member') as Role
  if (!allowedRoles.includes(role)) {
    return <Navigate to="/dashboard" replace />
  }
  return <Outlet />
}
