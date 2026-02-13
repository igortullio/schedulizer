import { Button } from '@igortullio-ui/react'
import { clientEnv } from '@schedulizer/env/client'
import { Loader2 } from 'lucide-react'
import { type ComponentProps, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate } from 'react-router-dom'
import { authClient, useSession } from '@/lib/auth-client'

type ButtonProps = ComponentProps<typeof Button>
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
  const { t } = useTranslation('billing')
  const { data: session, isPending: sessionPending } = useSession()
  const { data: activeOrg, isPending: orgPending } = authClient.useActiveOrganization()
  const navigate = useNavigate()
  const location = useLocation()
  const [state, setState] = useState<CheckoutState>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const isAuthenticated = !!session?.user
  const isDisabled = disabled || sessionPending || orgPending || state === 'loading'
  async function handleCheckout() {
    const currentUrl = `${location.pathname}${location.search}`
    if (!isAuthenticated) {
      navigate(`/auth/login?redirect=${encodeURIComponent(currentUrl)}`)
      return
    }
    if (!activeOrg) {
      navigate(`/auth/org-select?redirect=${encodeURIComponent(currentUrl)}`)
      return
    }
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
        const errorData = isCheckoutError(data) ? data : { error: { message: t('checkout.sessionError'), code: '' } }
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
      setErrorMessage(t('checkout.connectionError'))
      setState('error')
    }
  }
  return (
    <div className="flex flex-col">
      <Button onClick={handleCheckout} disabled={isDisabled} data-testid="checkout-button" {...props}>
        {state === 'loading' ? (
          <>
            <Loader2 className="animate-spin" aria-hidden="true" />
            <span>{t('checkout.processing')}</span>
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
    </div>
  )
}
