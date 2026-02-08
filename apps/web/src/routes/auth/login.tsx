import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Label } from '@schedulizer/ui'
import { CheckCircle2, Loader2, Mail } from 'lucide-react'
import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { signIn } from '@/lib/auth-client'
import { createLoginSchema, type LoginFormData } from '@/schemas/login.schema'

type FormState = 'idle' | 'submitting' | 'success' | 'error'

export function Component() {
  const { t } = useTranslation()
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const loginSchema = createLoginSchema(t)
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
        setErrorMessage(response.error.message || t('login.errors.failedToSend'))
        setFormState('error')
        return
      }
      setFormState('success')
    } catch (error) {
      console.error('Magic link request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      setErrorMessage(t('login.errors.unexpectedError'))
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
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('login.checkYourEmail')}</h1>
        <p className="mb-4 text-muted-foreground">
          {t('login.weSentMagicLink')} <span className="font-medium text-foreground">{emailValue}</span>
        </p>
        <p className="text-sm text-muted-foreground">{t('login.clickLinkInEmail')}</p>
      </output>
    )
  }

  return (
    <div className="rounded-lg border border-border bg-card p-8 shadow-sm">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{t('login.welcomeBack')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('login.enterEmail')}</p>
      </div>
      <form onSubmit={handleSubmit(handleLoginSubmit)} noValidate aria-label="Login form">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">{t('login.email')}</Label>
            <div className="relative">
              <Mail
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="email"
                type="email"
                placeholder={t('login.emailPlaceholder')}
                autoComplete="email"
                spellCheck={false}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className="pl-10"
                {...register('email', { onChange: handleInputChange })}
                data-testid="email-input"
              />
            </div>
            {errors.email ? (
              <p id="email-error" className="text-sm text-destructive" role="alert" data-testid="email-error">
                {errors.email.message}
              </p>
            ) : null}
          </div>
          {formState === 'error' && errorMessage ? (
            <div
              className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
              role="alert"
              data-testid="form-error"
            >
              {errorMessage}
            </div>
          ) : null}
          <Button type="submit" className="w-full" disabled={formState === 'submitting'} data-testid="submit-button">
            {formState === 'submitting' ? (
              <>
                <Loader2 className="animate-spin" aria-hidden="true" />
                <span>{t('login.sendingMagicLink')}</span>
              </>
            ) : (
              t('login.continueWithEmail')
            )}
          </Button>
        </div>
      </form>
    </div>
  )
}

export default Component
