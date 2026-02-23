import { zodResolver } from '@hookform/resolvers/zod'
import {
  Alert,
  AlertDescription,
  Button,
  Card,
  Input,
  Label,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@igortullio-ui/react'
import { CheckCircle2, Info, Loader2, Mail, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { PhoneInput } from '@/components/phone-input'
import { checkEmailExists, checkPhoneExists } from '@/hooks/use-check-identifier'
import { authClient, signIn, useSession } from '@/lib/auth-client'
import {
  createEmailLoginSchema,
  createNameSchema,
  createPhoneLoginSchema,
  type EmailFormData,
  type LoginMode,
  type NameFormData,
  type PhoneFormData,
} from '@/schemas/login.schema'

type FormState = 'idle' | 'checking' | 'needs-name' | 'submitting' | 'success' | 'error'

export function Component() {
  const { t } = useTranslation()
  const { data: session, isPending } = useSession()
  const [searchParams] = useSearchParams()
  const redirect = searchParams.get('redirect')
  const [formState, setFormState] = useState<FormState>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [mode, setMode] = useState<LoginMode>('phone')
  if (!isPending && session) {
    return <Navigate to="/dashboard" replace />
  }
  if (formState === 'success') {
    if (mode === 'phone') {
      return (
        <Card className="p-8 text-center" data-testid="login-success">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Phone className="h-6 w-6 text-green-600" aria-hidden="true" />
          </div>
          <h1 className="mb-2 text-xl font-semibold text-foreground">{t('login.checkYourWhatsApp')}</h1>
          <p className="mb-4 text-muted-foreground">{t('login.weSentWhatsAppLink')}</p>
          <p className="text-sm text-muted-foreground">{t('login.clickLinkInWhatsApp')}</p>
        </Card>
      )
    }
    return (
      <Card className="p-8 text-center" data-testid="login-success">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-6 w-6 text-green-600" aria-hidden="true" />
        </div>
        <h1 className="mb-2 text-xl font-semibold text-foreground">{t('login.checkYourEmail')}</h1>
        <p className="mb-4 text-muted-foreground">{t('login.weSentMagicLink')}</p>
        <p className="text-sm text-muted-foreground">{t('login.clickLinkInEmail')}</p>
      </Card>
    )
  }
  return (
    <Card className="p-8">
      <div className="mb-6 text-center">
        <h1 className="text-xl font-semibold text-foreground">{t('login.welcomeBack')}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === 'phone' ? t('login.enterPhone') : t('login.enterEmail')}
        </p>
      </div>
      {mode === 'phone' ? (
        <PhoneLoginForm
          formState={formState}
          errorMessage={errorMessage}
          onStateChange={setFormState}
          onErrorChange={setErrorMessage}
        />
      ) : (
        <EmailLoginForm
          formState={formState}
          errorMessage={errorMessage}
          redirect={redirect}
          onStateChange={setFormState}
          onErrorChange={setErrorMessage}
        />
      )}
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode(mode === 'phone' ? 'email' : 'phone')}
          className="text-sm text-muted-foreground underline hover:text-foreground"
          data-testid="switch-mode"
        >
          {mode === 'phone' ? t('login.switchToEmail') : t('login.switchToWhatsApp')}
        </button>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="cursor-help text-muted-foreground"
                aria-label={t('login.separateAccountsWarning')}
                data-testid="separate-accounts-warning"
              >
                <Info className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" className="max-w-xs text-center">
              {t('login.separateAccountsWarning')}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </Card>
  )
}

interface PhoneLoginFormProps {
  formState: FormState
  errorMessage: string
  onStateChange: (state: FormState) => void
  onErrorChange: (msg: string) => void
}

function PhoneLoginForm({ formState, errorMessage, onStateChange, onErrorChange }: PhoneLoginFormProps) {
  const { t } = useTranslation()
  const phoneSchema = useMemo(() => createPhoneLoginSchema(t), [t])
  const nameSchema = useMemo(() => createNameSchema(t), [t])
  const {
    handleSubmit: handlePhoneSubmit,
    formState: { errors: phoneErrors },
    watch: watchPhone,
    setValue: setPhoneValue,
    trigger: triggerPhone,
    getValues: getPhoneValues,
  } = useForm<PhoneFormData>({
    resolver: zodResolver(phoneSchema),
    defaultValues: { phone: '' },
  })
  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  })
  function handlePhoneChange(fullNumber: string) {
    setPhoneValue('phone', fullNumber)
    if (phoneErrors.phone) triggerPhone('phone')
    if (formState === 'error') {
      onStateChange('idle')
      onErrorChange('')
    }
  }
  async function handlePhoneCheck(data: PhoneFormData) {
    onStateChange('checking')
    onErrorChange('')
    try {
      const exists = await checkPhoneExists(data.phone)
      if (exists) {
        await sendOtp(data.phone)
        return
      }
      onStateChange('needs-name')
    } catch (error) {
      console.error('Phone check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onErrorChange(t('login.errors.unexpectedError'))
      onStateChange('error')
    }
  }
  async function handleNameAndSend(nameData: NameFormData) {
    const phone = getPhoneValues('phone')
    sessionStorage.setItem(`pendingName_${phone}`, nameData.name)
    await sendOtp(phone)
  }
  async function sendOtp(phone: string) {
    onStateChange('submitting')
    try {
      const response = await authClient.phoneNumber.sendOtp({ phoneNumber: phone })
      if (response.error) {
        onErrorChange(response.error.message || t('login.errors.failedToSend'))
        onStateChange('error')
        return
      }
      onStateChange('success')
    } catch (error) {
      console.error('Login request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onErrorChange(t('login.errors.unexpectedError'))
      onStateChange('error')
    }
  }
  const isLoading = formState === 'checking' || formState === 'submitting'
  return (
    <form
      onSubmit={formState === 'needs-name' ? handleNameSubmit(handleNameAndSend) : handlePhoneSubmit(handlePhoneCheck)}
      noValidate
      aria-label="Login form"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="phone">{t('login.phoneLabel')}</Label>
          <PhoneInput
            id="phone"
            value={watchPhone('phone')}
            onChange={handlePhoneChange}
            error={!!phoneErrors.phone}
            disabled={formState === 'needs-name'}
            data-testid="phone-input"
          />
          {phoneErrors.phone ? (
            <p id="phone-error" className="text-sm text-destructive" role="alert" data-testid="phone-error">
              {phoneErrors.phone.message}
            </p>
          ) : null}
        </div>
        {formState === 'needs-name' ? (
          <div className="space-y-2">
            <Label htmlFor="name">{t('login.nameLabel')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('login.namePlaceholder')}
              autoComplete="name"
              aria-invalid={!!nameErrors.name}
              aria-describedby={nameErrors.name ? 'name-error' : undefined}
              {...registerName('name')}
              data-testid="name-input"
            />
            {nameErrors.name ? (
              <p id="name-error" className="text-sm text-destructive" role="alert" data-testid="name-error">
                {nameErrors.name.message}
              </p>
            ) : null}
          </div>
        ) : null}
        {formState === 'error' && errorMessage ? (
          <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" disabled={isLoading} data-testid="submit-button">
          {isLoading ? (
            <>
              <Loader2 className="animate-spin" aria-hidden="true" />
              <span>{t('login.sendingWhatsAppLink')}</span>
            </>
          ) : (
            t('login.continueWithWhatsApp')
          )}
        </Button>
      </div>
    </form>
  )
}

interface EmailLoginFormProps {
  formState: FormState
  errorMessage: string
  redirect: string | null
  onStateChange: (state: FormState) => void
  onErrorChange: (msg: string) => void
}

function EmailLoginForm({ formState, errorMessage, redirect, onStateChange, onErrorChange }: EmailLoginFormProps) {
  const { t } = useTranslation()
  const emailSchema = useMemo(() => createEmailLoginSchema(t), [t])
  const nameSchema = useMemo(() => createNameSchema(t), [t])
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
    getValues: getEmailValues,
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  })
  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
  } = useForm<NameFormData>({
    resolver: zodResolver(nameSchema),
    defaultValues: { name: '' },
  })
  function handleInputChange() {
    if (formState === 'error') {
      onStateChange('idle')
      onErrorChange('')
    }
  }
  async function handleEmailCheck(data: EmailFormData) {
    onStateChange('checking')
    onErrorChange('')
    try {
      const exists = await checkEmailExists(data.email)
      if (exists) {
        await sendMagicLink(data.email, null)
        return
      }
      onStateChange('needs-name')
    } catch (error) {
      console.error('Email check failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onErrorChange(t('login.errors.unexpectedError'))
      onStateChange('error')
    }
  }
  async function handleNameAndSend(nameData: NameFormData) {
    const email = getEmailValues('email')
    await sendMagicLink(email, nameData.name)
  }
  async function sendMagicLink(email: string, name: string | null) {
    onStateChange('submitting')
    try {
      let callbackURL = redirect ? `/auth/verify?redirect=${encodeURIComponent(redirect)}` : '/auth/verify'
      if (name) {
        const separator = callbackURL.includes('?') ? '&' : '?'
        callbackURL = `${callbackURL}${separator}name=${encodeURIComponent(name)}`
      }
      const response = await signIn.magicLink({ email, callbackURL })
      if (response.error) {
        onErrorChange(response.error.message || t('login.errors.failedToSend'))
        onStateChange('error')
        return
      }
      onStateChange('success')
    } catch (error) {
      console.error('Login request failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      onErrorChange(t('login.errors.unexpectedError'))
      onStateChange('error')
    }
  }
  const isLoading = formState === 'checking' || formState === 'submitting'
  return (
    <form
      onSubmit={formState === 'needs-name' ? handleNameSubmit(handleNameAndSend) : handleEmailSubmit(handleEmailCheck)}
      noValidate
      aria-label="Login form"
    >
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
              aria-invalid={!!emailErrors.email}
              aria-describedby={emailErrors.email ? 'email-error' : undefined}
              className="pl-10"
              disabled={formState === 'needs-name'}
              {...registerEmail('email', { onChange: handleInputChange })}
              data-testid="email-input"
            />
          </div>
          {emailErrors.email ? (
            <p id="email-error" className="text-sm text-destructive" role="alert" data-testid="email-error">
              {emailErrors.email.message}
            </p>
          ) : null}
        </div>
        {formState === 'needs-name' ? (
          <div className="space-y-2">
            <Label htmlFor="name">{t('login.nameLabel')}</Label>
            <Input
              id="name"
              type="text"
              placeholder={t('login.namePlaceholder')}
              autoComplete="name"
              aria-invalid={!!nameErrors.name}
              aria-describedby={nameErrors.name ? 'name-error' : undefined}
              {...registerName('name')}
              data-testid="name-input"
            />
            {nameErrors.name ? (
              <p id="name-error" className="text-sm text-destructive" role="alert" data-testid="name-error">
                {nameErrors.name.message}
              </p>
            ) : null}
          </div>
        ) : null}
        {formState === 'error' && errorMessage ? (
          <Alert variant="destructive" className="border-0 bg-destructive/10" data-testid="form-error">
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" className="w-full" disabled={isLoading} data-testid="submit-button">
          {isLoading ? (
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
  )
}

export default Component
