import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle } from '@schedulizer/ui'
import { XCircle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export function Component() {
  const navigate = useNavigate()
  function handleTryAgain() {
    navigate('/pricing', { replace: false })
  }
  function handleGoToDashboard() {
    navigate('/dashboard', { replace: true })
  }
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <XCircle className="h-10 w-10 text-red-600" aria-hidden="true" />
          </div>
          <CardTitle className="text-2xl">Payment Cancelled</CardTitle>
          <CardDescription>Your payment was not completed</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Don&apos;t worry, no charges were made. You can try again whenever you&apos;re ready.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={handleTryAgain} className="w-full" data-testid="try-again">
              Try Again
            </Button>
            <Button onClick={handleGoToDashboard} variant="outline" className="w-full" data-testid="go-to-dashboard">
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default Component
