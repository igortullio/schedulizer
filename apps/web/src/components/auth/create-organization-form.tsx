import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@schedulizer/ui'
import { Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'
import { type CreateOrganizationFormData, createOrganizationSchema } from '@/schemas/create-organization.schema'

type CreationState = 'idle' | 'creating' | 'error'

function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
}

function getCreationErrorMessage(code?: string): string {
  if (code === 'ORGANIZATION_SLUG_ALREADY_TAKEN') {
    return 'An organization with a similar name already exists. Please choose a different name.'
  }
  if (code === 'YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION') {
    return 'You are not allowed to create organizations.'
  }
  return 'Failed to create organization. Please try again.'
}

export function CreateOrganizationForm() {
  const navigate = useNavigate()
  const [creationState, setCreationState] = useState<CreationState>('idle')
  const [creationError, setCreationError] = useState<string | null>(null)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(createOrganizationSchema),
    defaultValues: { name: '' },
  })
  async function handleCreateOrganization(data: CreateOrganizationFormData) {
    setCreationState('creating')
    setCreationError(null)
    const slug = generateSlug(data.name)
    try {
      const createResponse = await authClient.organization.create({ name: data.name, slug })
      if (createResponse.error) {
        console.error('Failed to create organization', {
          code: createResponse.error.code,
          message: createResponse.error.message,
        })
        setCreationError(getCreationErrorMessage(createResponse.error.code))
        setCreationState('error')
        return
      }
      const setActiveResponse = await authClient.organization.setActive({
        organizationId: createResponse.data.id,
      })
      if (setActiveResponse.error) {
        console.error('Failed to set active organization after creation', {
          organizationId: createResponse.data.id,
          code: setActiveResponse.error.code,
        })
        setCreationError('Organization created but failed to activate. Please refresh and try again.')
        setCreationState('error')
        return
      }
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Failed to create organization', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setCreationError('An unexpected error occurred. Please try again.')
      setCreationState('error')
    }
  }
  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm" data-testid="org-create-form">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">Create your organization</h1>
        <p className="mt-1 text-sm text-muted-foreground">Get started by creating your first organization</p>
      </div>
      <form onSubmit={handleSubmit(handleCreateOrganization)} noValidate aria-label="Create organization form">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">Organization name</Label>
            <Input
              id="org-name"
              type="text"
              placeholder="Acme Inc…"
              autoComplete="organization"
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'org-name-error' : undefined}
              {...register('name')}
              data-testid="org-name-input"
            />
            {errors.name ? (
              <p id="org-name-error" className="text-sm text-destructive" role="alert" data-testid="org-name-error">
                {errors.name.message}
              </p>
            ) : null}
          </div>
          {creationState === 'error' && creationError ? (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              data-testid="org-create-error"
            >
              {creationError}
            </div>
          ) : null}
          <Button
            type="submit"
            className="w-full"
            disabled={creationState === 'creating'}
            data-testid="org-create-button"
          >
            {creationState === 'creating' ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Creating organization…</span>
              </>
            ) : (
              'Create organization'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}
