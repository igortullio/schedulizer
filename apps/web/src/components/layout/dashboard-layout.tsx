import { Loader2 } from 'lucide-react'
import { Navigate, Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/sidebar'
import { authClient, useSession } from '@/lib/auth-client'

export function DashboardLayout() {
  const { data: session, isPending: sessionPending } = useSession()
  const { data: activeOrg, isPending: orgPending } = authClient.useActiveOrganization()
  if (sessionPending || orgPending) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
      </div>
    )
  }
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  if (!activeOrg) {
    return <Navigate to="/auth/org-select" replace />
  }
  return (
    <div className="flex h-screen bg-background">
      <Sidebar organizationName={activeOrg.name} />
      <main className="flex flex-1 flex-col overflow-auto p-6 pt-16 md:p-8 md:pt-8">
        <Outlet />
      </main>
    </div>
  )
}
