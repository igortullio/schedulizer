import { Button } from '@schedulizer/ui'
import { AlertCircle, Building2, ChevronRight, Loader2, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CreateOrganizationForm } from '@/components/auth/create-organization-form'
import { authClient } from '@/lib/auth-client'
import { getSelectionErrorMessage } from './org-select.utils'

type SelectionState = 'idle' | 'selecting' | 'error'

interface SelectionError {
  message: string
  organizationId?: string
}

export function Component() {
  const navigate = useNavigate()
  const { data: organizations, isPending, error: fetchError } = authClient.useListOrganizations()
  const [selectionState, setSelectionState] = useState<SelectionState>('idle')
  const [selectionError, setSelectionError] = useState<SelectionError | null>(null)
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null)

  const handleSelectOrganization = useCallback(
    async (organizationId: string) => {
      setSelectionState('selecting')
      setSelectedOrgId(organizationId)
      setSelectionError(null)
      try {
        const response = await authClient.organization.setActive({ organizationId })
        if (response.error) {
          console.error('Failed to set active organization', {
            organizationId,
            code: response.error.code,
            message: response.error.message,
          })
          setSelectionError({
            message: getSelectionErrorMessage(response.error.status),
            organizationId,
          })
          setSelectionState('error')
          return
        }
        navigate('/dashboard', { replace: true })
      } catch (err) {
        console.error('Failed to set active organization', {
          organizationId,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        setSelectionError({
          message: 'An unexpected error occurred. Please try again.',
          organizationId,
        })
        setSelectionState('error')
      }
    },
    [navigate],
  )

  useEffect(() => {
    if (isPending) return
    if (!organizations || organizations.length === 0) return
    if (organizations.length !== 1) return
    handleSelectOrganization(organizations[0].id)
  }, [organizations, isPending, handleSelectOrganization])

  function handleRetry() {
    if (!selectionError?.organizationId) return
    handleSelectOrganization(selectionError.organizationId)
  }

  if (isPending) {
    return (
      <div
        className="flex flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="org-select-loading"
      >
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">Loading organizations</h1>
        <p className="text-muted-foreground">Please wait while we load your organizations…</p>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div
        className="flex flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="org-select-fetch-error"
        role="alert"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Failed to load organizations</h1>
        <p className="mb-6 text-muted-foreground" data-testid="org-select-fetch-error-message">
          {fetchError.message || 'An error occurred while loading your organizations.'}
        </p>
        <Button onClick={() => window.location.reload()} variant="outline">
          Try again
        </Button>
      </div>
    )
  }

  if (!organizations || organizations.length === 0) {
    return <CreateOrganizationForm />
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm" data-testid="org-select-list">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Select an organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">Choose which organization you want to work with</p>
      </div>
      {selectionState === 'error' && selectionError ? (
        <div
          className="mb-4 flex items-center justify-between rounded-md bg-destructive/10 p-3 text-sm text-destructive"
          role="alert"
          data-testid="org-select-selection-error"
        >
          <span>{selectionError.message}</span>
          <Button variant="ghost" size="sm" onClick={handleRetry} className="text-destructive hover:text-destructive">
            Retry
          </Button>
        </div>
      ) : null}
      <ul className="space-y-2" aria-label="Organizations">
        {organizations.map(org => {
          const isSelecting = selectionState === 'selecting' && selectedOrgId === org.id
          return (
            <li key={org.id}>
              <button
                type="button"
                onClick={() => handleSelectOrganization(org.id)}
                disabled={selectionState === 'selecting'}
                className="flex w-full items-center gap-4 rounded-lg border border-border p-4 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                data-testid={`org-item-${org.id}`}
                aria-busy={isSelecting}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  {org.logo ? (
                    <img
                      src={org.logo}
                      alt=""
                      width={40}
                      height={40}
                      className="h-10 w-10 rounded-lg object-cover"
                      aria-hidden="true"
                    />
                  ) : (
                    <Building2 className="h-5 w-5 text-primary" aria-hidden="true" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{org.name}</p>
                  <p className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Users className="h-3 w-3" aria-hidden="true" />
                    <span data-testid={`org-member-count-${org.id}`}>Organization</span>
                  </p>
                </div>
                <div className="shrink-0">
                  {isSelecting ? (
                    <Loader2 className="h-5 w-5 animate-spin text-primary" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  )}
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

export default Component
