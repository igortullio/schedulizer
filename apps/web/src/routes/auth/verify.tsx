import { Button } from '@schedulizer/ui'
import type { TFunction } from 'i18next'
import { AlertCircle, ArrowLeft, Loader2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'

type VerifyState = 'verifying' | 'success' | 'error'

interface VerifyError {
  message: string
  code?: string
}

export function Component() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verifyState, setVerifyState] = useState<VerifyState>('verifying')
  const [error, setError] = useState<VerifyError | null>(null)
  const token = searchParams.get('token')

  useEffect(() => {
    async function verifyMagicLink() {
      if (!token) {
        setError({ message: t('verify.errors.missingToken'), code: 'MISSING_TOKEN' })
        setVerifyState('error')
        return
      }
      try {
        const response = await authClient.magicLink.verify({
          query: { token },
        })
        if (response.error) {
          console.error('Magic link verification failed', {
            code: response.error.code,
            message: response.error.message,
          })
          setError({
            message: getErrorMessage(response.error.code, t),
            code: response.error.code,
          })
          setVerifyState('error')
          return
        }
        setVerifyState('success')
        navigate('/auth/org-select', { replace: true })
      } catch (err) {
        console.error('Magic link verification failed', {
          error: err instanceof Error ? err.message : 'Unknown error',
        })
        setError({ message: t('verify.errors.unexpectedError'), code: 'UNKNOWN' })
        setVerifyState('error')
      }
    }
    verifyMagicLink()
  }, [token, navigate, t])

  if (verifyState === 'verifying') {
    return (
      <div
        className="flex flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="verify-loading"
      >
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('verify.verifying')}</h1>
        <p className="text-muted-foreground">{t('verify.pleaseWait')}</p>
      </div>
    )
  }

  if (verifyState === 'error') {
    return (
      <div
        className="flex flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="verify-error"
        role="alert"
      >
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('verify.verificationFailed')}</h1>
        <p className="mb-6 text-muted-foreground" data-testid="verify-error-message">
          {error?.message || t('verify.errors.genericError')}
        </p>
        <Button asChild variant="outline">
          <Link to="/auth/login" data-testid="back-to-login-link">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            {t('verify.backToLogin')}
          </Link>
        </Button>
      </div>
    )
  }

  return null
}

function getErrorMessage(code: string | undefined, t: TFunction): string {
  const errorMessages: Record<string, string> = {
    INVALID_TOKEN: t('verify.errors.invalidToken'),
    EXPIRED_TOKEN: t('verify.errors.expiredToken'),
    TOKEN_NOT_FOUND: t('verify.errors.tokenNotFound'),
    MISSING_TOKEN: t('verify.errors.missingToken'),
  }
  return errorMessages[code || ''] || t('verify.errors.defaultError')
}

export default Component
