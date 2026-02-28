import { Button, Card } from '@igortullio-ui/react'
import { AlertCircle, Loader2, Phone } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { authClient } from '@/lib/auth-client'

type VerifyState = 'verifying' | 'success' | 'error'

export function Component() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const code = searchParams.get('code')
  const phone = searchParams.get('phone')
  const nameFromUrl = searchParams.get('name')
  const [state, setState] = useState<VerifyState>(() => (code && phone ? 'verifying' : 'error'))
  const [errorMessage, setErrorMessage] = useState('')
  const verifiedRef = useRef(false)
  useEffect(() => {
    if (!code || !phone || verifiedRef.current) return
    verifiedRef.current = true
    authClient.phoneNumber
      .verify({ phoneNumber: phone, code })
      .then(async response => {
        if (response.error) {
          setErrorMessage(response.error.message || t('verify.phoneVerificationFailed'))
          setState('error')
          return
        }
        const pendingName = nameFromUrl || localStorage.getItem(`pendingName_${phone}`)
        if (pendingName) {
          localStorage.removeItem(`pendingName_${phone}`)
          await authClient.updateUser({ name: pendingName })
        }
        setState('success')
        navigate('/auth/org-select', { replace: true })
      })
      .catch(error => {
        console.error('Phone verification failed', {
          error: error instanceof Error ? error.message : 'Unknown error',
        })
        setErrorMessage(t('verify.phoneVerificationFailed'))
        setState('error')
      })
  }, [code, phone, nameFromUrl, navigate, t])
  if (state === 'verifying') {
    return (
      <Card className="p-8 text-center" data-testid="verify-phone-loading">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Loader2 className="h-6 w-6 animate-spin text-blue-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('verify.verifyingPhone')}</h1>
        <p className="text-sm text-muted-foreground">{t('verify.pleaseWait')}</p>
      </Card>
    )
  }
  if (state === 'error') {
    return (
      <Card className="p-8 text-center" data-testid="verify-phone-error">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
          <AlertCircle className="h-6 w-6 text-red-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('verify.phoneVerificationFailed')}</h1>
        <p className="mb-4 text-sm text-muted-foreground">{errorMessage || t('verify.errors.defaultError')}</p>
        <Button asChild variant="outline">
          <Link to="/auth/login">{t('verify.backToLogin')}</Link>
        </Button>
      </Card>
    )
  }
  return (
    <Card className="p-8 text-center" data-testid="verify-phone-success">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
        <Phone className="h-6 w-6 text-green-600" aria-hidden="true" />
      </div>
      <h1 className="mb-2 text-xl font-semibold text-foreground">{t('verify.phoneVerified')}</h1>
      <p className="text-sm text-muted-foreground">{t('verify.redirecting')}</p>
    </Card>
  )
}

export default Component
