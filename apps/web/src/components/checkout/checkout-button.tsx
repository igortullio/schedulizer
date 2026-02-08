import { clientEnv } from '@schedulizer/env/client'
import { Button, type ButtonProps } from '@schedulizer/ui'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'
import { useSession } from '@/lib/auth-client'

type CheckoutState = 'idle' | 'loading' | 'error'

interface CheckoutButtonProps extends Omit<ButtonProps, 'onClick'> {
  priceId: string
  planName: string
}

interface CheckoutErrorResponse {
  error: {
    message: string
    code: string
  }
}

interface CheckoutSuccessResponse {
  data: {
    url: string
    sessionId: string
  }
}

type CheckoutResponse = CheckoutErrorResponse | CheckoutSuccessResponse

function isCheckoutError(response: CheckoutResponse): response is CheckoutErrorResponse {
  return 'error' in response
}

export function CheckoutButton({ priceId, planName, children, disabled, ...props }: CheckoutButtonProps) {
  const { data: session, isPending: sessionPending } = useSession()
  const [state, setState] = useState<CheckoutState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isAuthenticated = !!session?.user
  const isDisabled = disabled || !isAuthenticated || sessionPending || state === 'loading'
  async function handleCheckout() {
    if (!isAuthenticated) return
    setState('loading')
    setErrorMessage(null)
    try {
      const successUrl = `${window.location.origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`
      const cancelUrl = `${window.location.origin}/checkout/cancel`
      const response = await fetch(`${clientEnv.apiUrl}/api/billing/checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          priceId,
          successUrl,
          cancelUrl,
        }),
      })
      const data: CheckoutResponse = await response.json()
      if (!response.ok || isCheckoutError(data)) {
        const errorData = isCheckoutError(data) ? data : { error: { message: 'Failed to create checkout session' } }
        console.error('Checkout failed', { priceId, planName, error: errorData.error.message })
        setErrorMessage(errorData.error.message)
        setState('error')
        return
      }
      console.log('Redirecting to checkout', { priceId, planName })
      window.location.href = data.data.url
    } catch (err) {
      console.error('Checkout request failed', {
        priceId,
        planName,
        error: err instanceof Error ? err.message : 'Unknown error',
      })
      setErrorMessage('Failed to connect to payment service. Please try again.')
      setState('error')
    }
  }
  return (
    <div className="flex flex-col">
      <Button onClick={handleCheckout} disabled={isDisabled} data-testid="checkout-button" {...props}>
        {state === 'loading' ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>Processing...</span>
          </>
        ) : (
          children
        )}
      </Button>
      {state === 'error' && errorMessage ? (
        <p className="mt-2 text-sm text-destructive" role="alert" data-testid="checkout-error">
          {errorMessage}
        </p>
      ) : null}
      {!isAuthenticated && !sessionPending ? (
        <p className="mt-2 text-sm text-muted-foreground" data-testid="checkout-auth-hint">
          Please sign in to subscribe
        </p>
      ) : null}
    </div>
  )
}
