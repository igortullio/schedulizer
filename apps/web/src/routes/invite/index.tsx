import { Alert, AlertDescription, Button, Card } from '@igortullio-ui/react'
import { AlertCircle, CheckCircle2, Loader2, Mail, Users } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams } from 'react-router-dom'
import { authClient, signIn, useSession } from '@/lib/auth-client'

interface InvitationData {
  id: string
  organizationName: string
  inviterName: string
  email: string
  role: string
  status: string
  expiresAt: string
  organizationId?: string
}

type PageState = 'loading' | 'show-invitation' | 'accepting' | 'accepted' | 'signing-in' | 'magic-link-sent' | 'error'

interface PageError {
  message: string
  code?: string
}

const ROLE_LABELS = {
  owner: 'roles.owner',
  admin: 'roles.admin',
  member: 'roles.member',
} as const

export function Component() {
  const { t } = useTranslation('invite')
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: session, isPending: isSessionPending } = useSession()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [invitation, setInvitation] = useState<InvitationData | null>(null)
  const [error, setError] = useState<PageError | null>(null)

  const fetchInvitation = useCallback(async () => {
    if (!id) {
      setError({ message: t('errors.invalidId'), code: 'INVALID_ID' })
      setPageState('error')
      return null
    }
    try {
      const response = await fetch(`/api/invitations/${id}`)
      const body = await response.json()
      if (!response.ok) {
        const errorCode = body.error?.code ?? 'UNKNOWN'
        setError({ message: mapFetchError(errorCode, t), code: errorCode })
        setPageState('error')
        return null
      }
      setInvitation(body.data)
      return body.data as InvitationData
    } catch (err) {
      console.error('Failed to fetch invitation', {
        invitationId: id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError({ message: t('errors.fetchFailed'), code: 'FETCH_FAILED' })
      setPageState('error')
      return null
    }
  }, [id, t])

  const acceptInvitation = useCallback(async () => {
    if (!id) return
    setPageState('accepting')
    try {
      const response = await authClient.organization.acceptInvitation({
        invitationId: id,
      })
      if (response.error) {
        console.error('Invitation acceptance failed', {
          invitationId: id,
          code: response.error.code,
          message: response.error.message,
        })
        setError({ message: mapAcceptError(response.error.code, t), code: response.error.code })
        setPageState('error')
        return
      }
      const organizationId = response.data?.member?.organizationId
      if (organizationId) {
        await authClient.organization.setActive({ organizationId })
      }
      setPageState('accepted')
      navigate('/dashboard', { replace: true })
    } catch (err) {
      console.error('Invitation acceptance failed', {
        invitationId: id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError({ message: t('errors.acceptFailed'), code: 'ACCEPT_FAILED' })
      setPageState('error')
    }
  }, [id, navigate, t])

  useEffect(() => {
    if (isSessionPending) return
    async function initialize() {
      const data = await fetchInvitation()
      if (!data) return
      if (session) {
        await acceptInvitation()
      } else {
        setPageState('show-invitation')
      }
    }
    initialize()
  }, [isSessionPending, session, fetchInvitation, acceptInvitation])

  async function handleMagicLinkSignIn() {
    if (!invitation) return
    setPageState('signing-in')
    try {
      const callbackUrl = `/auth/verify?redirect=${encodeURIComponent(`/invite/${id}`)}`
      const response = await signIn.magicLink({
        email: invitation.email,
        callbackURL: callbackUrl,
      })
      if (response.error) {
        setError({ message: t('errors.magicLinkFailed'), code: 'MAGIC_LINK_FAILED' })
        setPageState('error')
        return
      }
      setPageState('magic-link-sent')
    } catch (err) {
      console.error('Magic link sign-in failed', {
        invitationId: id,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setError({ message: t('errors.magicLinkFailed'), code: 'MAGIC_LINK_FAILED' })
      setPageState('error')
    }
  }

  if (pageState === 'loading' || pageState === 'accepting') {
    return (
      <Card className="flex flex-col items-center p-8 text-center" data-testid="invite-loading">
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">
          {pageState === 'accepting' ? t('accepting') : t('loading')}
        </h1>
        <p className="text-muted-foreground">
          {pageState === 'accepting' ? t('acceptingDescription') : t('loadingDescription')}
        </p>
      </Card>
    )
  }

  if (pageState === 'accepted') {
    return (
      <Card className="flex flex-col items-center p-8 text-center" data-testid="invite-accepted">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('accepted')}</h1>
        <p className="text-muted-foreground">{t('acceptedDescription')}</p>
      </Card>
    )
  }

  if (pageState === 'magic-link-sent') {
    return (
      <Card className="flex flex-col items-center p-8 text-center" data-testid="invite-magic-link-sent">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('magicLinkSent')}</h1>
        <p className="mb-4 text-muted-foreground">
          {t('magicLinkSentDescription')} <span className="font-medium text-foreground">{invitation?.email}</span>
        </p>
        <p className="text-sm text-muted-foreground">{t('magicLinkSentHint')}</p>
      </Card>
    )
  }

  if (pageState === 'error') {
    return (
      <Card className="flex flex-col items-center p-8 text-center" data-testid="invite-error" role="alert">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('errorTitle')}</h1>
        <p className="mb-6 text-muted-foreground" data-testid="invite-error-message">
          {error?.message ?? t('errors.unknown')}
        </p>
        <Button variant="outline" onClick={() => navigate('/auth/login')} data-testid="invite-error-login-button">
          {t('goToLogin')}
        </Button>
      </Card>
    )
  }

  const roleKey = ROLE_LABELS[(invitation?.role as keyof typeof ROLE_LABELS) ?? 'member'] ?? ROLE_LABELS.member

  return (
    <Card className="flex flex-col items-center p-8 text-center" data-testid="invite-page">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
        <Users className="h-6 w-6 text-primary" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">{t('title')}</h1>
      <p className="mb-6 text-muted-foreground">
        {t('description', {
          inviterName: invitation?.inviterName,
          organizationName: invitation?.organizationName,
        })}
      </p>
      <Alert className="mb-6 border-0 bg-muted/50 text-left">
        <AlertDescription>
          <div className="space-y-1 text-sm">
            <div>
              <span className="font-medium">{t('organization')}:</span> {invitation?.organizationName}
            </div>
            <div>
              <span className="font-medium">{t('role')}:</span> {t(roleKey)}
            </div>
            <div>
              <span className="font-medium">{t('email')}:</span> {invitation?.email}
            </div>
          </div>
        </AlertDescription>
      </Alert>
      <Button className="w-full" onClick={handleMagicLinkSignIn} data-testid="invite-magic-link-button">
        <Mail className="h-4 w-4" aria-hidden="true" />
        {t('signInToAccept')}
      </Button>
    </Card>
  )
}

type TranslationFn = ReturnType<typeof useTranslation<'invite'>>['t']

function mapFetchError(code: string, t: TranslationFn): string {
  const errorMessages: Record<string, string> = {
    INVALID_REQUEST: t('errors.invalidId'),
    NOT_FOUND: t('errors.notFound'),
    INVITATION_EXPIRED: t('errors.expired'),
    INVITATION_INVALID: t('errors.invalid'),
  }
  return errorMessages[code] ?? t('errors.unknown')
}

function mapAcceptError(code: string | undefined, t: TranslationFn): string {
  const errorMessages: Record<string, string> = {
    INVITATION_NOT_FOUND: t('errors.notFound'),
    INVITATION_EXPIRED: t('errors.expired'),
    EMAIL_MISMATCH: t('errors.emailMismatch'),
  }
  return errorMessages[code ?? ''] ?? t('errors.acceptFailed')
}

export default Component
