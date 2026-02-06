import { zodResolver } from '@hookform/resolvers/zod'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { signIn } from '@/lib/auth-client'
import { type LoginFormData, loginSchema } from '@/schemas/login.schema'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function Component() {
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '' },
  })
  const emailValue = watch('email')

  async function handleLoginSubmit(data: LoginFormData) {
    setFormState('submitting')
    setErrorMessage('')
    try {
      const response = await signIn.magicLink({
        email: data.email,
        callbackURL: '/auth/verify',
      })
      if (response.error) {
        setErrorMessage(response.error.message || 'Failed to send magic link. Please try again.')
        setFormState('error')
        return
      }
      setFormState('success')
    } catch (error) {
      console.error('Magic link request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setErrorMessage('An unexpected error occurred. Please try again.')
      setFormState('error')
    }
  }

  function handleInputChange() {
    if (formState === 'error') {
      setFormState('idle')
      setErrorMessage('')
    }
  }

  if (formState === 'success') {
    return (
      <output
        className="block rounded-lg border border-border bg-card p-8 text-center shadow-sm"
        data-testid="login-success"
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">Check your email</h1>
        <p className="mb-4 text-muted-foreground">
          We sent a magic link to <span className="font-medium text-foreground">{emailValue}</span>
        </p>
        <p className="text-sm text-muted-foreground">Click the link in the email to sign in to your account.</p>
      </output>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">Welcome back</h1>
        <p className="mt-1 text-sm text-muted-foreground">Enter your email to sign in to your account</p>
      </div>
      <form onSubmit={handleSubmit(handleLoginSubmit)} noValidate aria-label="Login form">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="pl-10"
                {...register('email', { onChange: handleInputChange })}
                data-testid="email-input"
              />
            </div>
            {errors.email && (
              <p id="email-error" className="text-sm text-destructive" role="alert" data-testid="email-error">
                {errors.email.message}
              </p>
            )}
          </div>
          {formState === 'error' && errorMessage && (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              data-testid="form-error"
            >
              {errorMessage}
            </div>
          )}
          <Button type="submit" className="w-full" disabled={formState === 'submitting'} data-testid="submit-button">
            {formState === 'submitting' ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>Sending magic link...</span>
              </>
            ) : (
              'Continue with Email'
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Component
