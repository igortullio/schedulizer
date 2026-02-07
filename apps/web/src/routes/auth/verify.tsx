import AlertCircle from 'lucide-react/dist/esm/icons/alert-circle'
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left'
import Loader2 from 'lucide-react/dist/esm/icons/loader-2'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { authClient } from '@/lib/auth-client'

type VerifyState = 'verifying' | 'success' | 'error'

interface VerifyError {
  message: string
  code?: string
}

export function Component() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [verifyState, setVerifyState] = useState<VerifyState>('verifying')
  const [error, setError] = useState<VerifyError | null>(null)
  const token = searchParams.get('token')

  useEffect(() => {
    async function verifyMagicLink() {
      if (!token) {
        setError({ message: 'Token not found in URL', code: 'MISSING_TOKEN' })
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
            message: getErrorMessage(response.error.code),
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
        setError({ message: 'An unexpected error occurred. Please try again.', code: 'UNKNOWN' })
        setVerifyState('error')
      }
    }
    verifyMagicLink()
  }, [token, navigate])

  if (verifyState === 'verifying') {
    return (
      <div
        className="flex flex-col items-center rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="verify-loading"
      >
        <Loader2 className="mb-4 h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        <h1 className="mb-2 text-xl font-semibold text-foreground">Verifying your link</h1>
        <p className="text-muted-foreground">Please wait while we verify your magic link...</p>
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
        <h1 className="mb-2 text-xl font-semibold text-foreground">Verification failed</h1>
        <p className="mb-6 text-muted-foreground" data-testid="verify-error-message">
          {error?.message || 'An error occurred during verification.'}
        </p>
        <Button asChild variant="outline">
          <Link to="/auth/login" data-testid="back-to-login-link">
            <ArrowLeft className="mr-2 h-4 w-4" aria-hidden="true" />
            Back to login
          </Link>
        </Button>
      </div>
    )
  }

  return null
}

function getErrorMessage(code?: string): string {
  const errorMessages: Record<string, string> = {
    INVALID_TOKEN: 'This link is invalid. Please request a new one.',
    EXPIRED_TOKEN: 'This link has expired. Please request a new one.',
    TOKEN_NOT_FOUND: 'This link is invalid. Please request a new one.',
    MISSING_TOKEN: 'No verification token was provided.',
  }
  return errorMessages[code || ''] || 'This link is invalid or has expired. Please request a new one.'
}

export default Component
