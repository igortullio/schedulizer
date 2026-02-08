import { Button } from '@schedulizer/ui'
import { Building2, LogOut, User } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { authClient, signOut, useSession } from '@/lib/auth-client'

export function Component() {
  const navigate = useNavigate()
  const { data: session, isPending: sessionPending } = useSession()
  const { data: activeOrg, isPending: orgPending } = authClient.useActiveOrganization()

  async function handleSignOut() {
    await signOut()
    navigate('/auth/login', { replace: true })
  }

  if (sessionPending || orgPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-foreground">Dashboard</h1>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border p-4">
            <User className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Logged in as</p>
              <p className="font-medium text-foreground">{session?.user?.email ?? 'Unknown'}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border p-4">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">Active organization</p>
              <p className="font-medium text-foreground">{activeOrg?.name ?? 'None'}</p>
              {activeOrg?.slug ? (
                <p className="text-xs text-muted-foreground">{activeOrg.slug}</p>
              ) : null}
            </div>
          </div>
        </div>
        <Button onClick={handleSignOut} variant="outline" className="mt-6 w-full">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          Sign out
        </Button>
      </div>
    </div>
  )
}

export default Component
