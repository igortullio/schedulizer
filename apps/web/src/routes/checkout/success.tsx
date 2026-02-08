import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schedulizer/ui'
import { CheckCircle } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'

export function Component() {
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
          <CardTitle className="text-2xl">Payment Successful!</CardTitle>
          <CardDescription>Thank you for subscribing to Schedulizer</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Your subscription is now active. You can start using all premium features immediately.
          </p>
          {sessionId ? (
            <p className="text-xs text-muted-foreground" data-testid="session-id">
              Transaction ID: {sessionId}
            </p>
          ) : null}
          <Button onClick={handleGoToDashboard} className="w-full" data-testid="go-to-dashboard">
            Go to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

export default Component
