import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schedulizer/ui'
import { CheckCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function Component() {
  const { t } = useTranslation('billing')
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const sessionId = searchParams.get('session_id')
  function handleGoToDashboard() {
    navigate('/dashboard', { replace: true })
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle className="h-10 w-10 text-green-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">{t('checkout.success.title')}</CardTitle>
          <CardDescription>{t('checkout.success.description')}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">{t('checkout.success.message')}</p>
          {sessionId ? (
            <p className="text-xs text-muted-foreground" data-testid="session-id">
              {t('checkout.success.transactionId', { sessionId })}
            </p>
          ) : null}
          <Button onClick={handleGoToDashboard} className="w-full" data-testid="go-to-dashboard">
            {t('checkout.success.goToDashboard')}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Component
