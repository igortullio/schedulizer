import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@igortullio-ui/react'
import type { TFunction } from 'i18next'
import { Building2, Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
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

function getCreationErrorMessage(code: string | undefined, t: TFunction): string {
  if (code === 'ORGANIZATION_SLUG_ALREADY_TAKEN') {
    return t('orgCreate.errors.slugTaken')
  }
  if (code === 'YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION') {
    return t('orgCreate.errors.notAllowed')
  }
  return t('orgCreate.errors.failedToCreate')
}

interface CreateOrganizationFormProps {
  redirect?: string | null
}

export function CreateOrganizationForm({ redirect }: CreateOrganizationFormProps) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [creationState, setCreationState] = useState<CreationState>('idle')
  const [creationError, setCreationError] = useState<string | null>(null)
  const orgSchema = createOrganizationSchema(t)
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreateOrganizationFormData>({
    resolver: zodResolver(orgSchema),
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
        setCreationError(getCreationErrorMessage(createResponse.error.code, t))
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
        setCreationError(t('orgCreate.errors.createdButFailedToActivate'))
        setCreationState('error')
        return
      }
      const destination = redirect?.startsWith('/') ? redirect : '/dashboard'
      navigate(destination, { replace: true })
    } catch (err) {
      console.error('Failed to create organization', {
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setCreationError(t('orgCreate.errors.unexpectedError'))
      setCreationState('error')
    }
  }
  return (
    <Card className="p-8" data-testid="org-create-form">
      <div className="mb-6 text-center">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
          <Building2 className="h-6 w-6 text-primary" aria-hidden="true" />
        </div>
        <h1 className="text-xl font-semibold text-foreground">{t('orgCreate.title')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('orgCreate.subtitle')}</p>
      </div>
      <form onSubmit={handleSubmit(handleCreateOrganization)} noValidate aria-label="Create organization form">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="org-name">{t('orgCreate.organizationName')}</Label>
            <Input
              id="org-name"
              type="text"
              placeholder={t('orgCreate.placeholder')}
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
            <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="org-create-error">
              <AlertDescription>{creationError}</AlertDescription>
            </Alert>
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
                <span>{t('orgCreate.creating')}</span>
              </>
            ) : (
              t('orgCreate.createButton')
            )}
          </Button>
        </div>
      </form>
    </Card>
  )
}
