import { Button } from '@schedulizer/ui'
import { Building2, CreditCard, LogOut, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { authClient, signOut, useSession } from '@/lib/auth-client'

export function Component() {
  const { t } = useTranslation('billing')
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
  if (!session) {
    return <Navigate to="/auth/login" replace />
  }
  if (!activeOrg) {
    return <Navigate to="/auth/org-select" replace />
  }
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm">
        <h1 className="mb-6 text-center text-xl font-semibold text-foreground">{t('dashboard.title')}</h1>
        <div className="space-y-4">
          <div className="flex items-center gap-3 rounded-md border border-border p-4">
            <User className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.loggedInAs')}</p>
              <p className="font-medium text-foreground">{session?.user?.email ?? t('dashboard.unknown')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-md border border-border p-4">
            <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.activeOrganization')}</p>
              <p className="font-medium text-foreground">{activeOrg?.name ?? t('dashboard.none')}</p>
              {activeOrg?.slug ? <p className="text-xs text-muted-foreground">{activeOrg.slug}</p> : null}
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/subscription')}
            className="flex w-full items-center gap-3 rounded-md border border-border p-4 text-left transition-colors hover:bg-accent"
            data-testid="subscription-link"
          >
            <CreditCard className="h-5 w-5 text-primary" aria-hidden="true" />
            <div>
              <p className="text-sm text-muted-foreground">{t('dashboard.subscription')}</p>
              <p className="font-medium text-foreground">{t('dashboard.manageBilling')}</p>
            </div>
          </button>
        </div>
        <Button onClick={handleSignOut} variant="outline" className="mt-6 w-full">
          <LogOut className="mr-2 h-4 w-4" aria-hidden="true" />
          {t('dashboard.signOut')}
        </Button>
      </div>
    </div>
  )
}

export default Component
