# Auth User Table Improvements Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Collect user name during registration for both phone and email flows, and remove fake email generation for phone users by making `email` nullable.

**Architecture:** Before sending OTP/magic link, the frontend checks if the identifier (phone or email) exists. If new, a name field appears inline on the login page. For phone flow, the name is stored in `sessionStorage` and applied via `updateUser` after OTP verification. For email/magic link flow, the name is encoded in the `callbackURL` so it survives cross-device clicks.

**Tech Stack:** Drizzle ORM, better-auth (phoneNumber + magicLink plugins), React, React Router v6, Zod, Vitest/Testing Library, i18next.

---

## Task 1: Make `email` and `name` nullable in DB schema

**Files:**
- Modify: `libs/db/src/schema.ts:18-28`

**Step 1: Update the users table definition**

In `libs/db/src/schema.ts`, change the `users` table:

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),                    // was .notNull()
  email: text('email').unique(),         // was .notNull().unique()
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

**Step 2: Commit**

```bash
git add libs/db/src/schema.ts
git commit -m "refactor(db): make users email and name nullable"
```

---

## Task 2: Generate and apply DB migration

> **Skill:** Use `/db-migrate` skill if available. Otherwise follow steps below.

**Files:**
- Create: `libs/db/drizzle/0009_nullable_user_email_name.sql` (auto-generated)
- Modify: `libs/db/drizzle/meta/_journal.json` (auto-generated)

**Step 1: Generate the migration**

```bash
npx nx run db:generate
```

Expected: Creates `libs/db/drizzle/0009_*.sql` with:
```sql
ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
ALTER TABLE "users" ALTER COLUMN "email" DROP NOT NULL;
```

**Step 2: Review the generated migration**

Open the generated `.sql` file and confirm it only drops NOT NULL constraints — nothing else. If it tries to drop the unique constraint on email, that is wrong; manually correct it.

**Step 3: Apply the migration**

```bash
npx nx run db:migrate
```

Expected output: `Running migration: 0009_*.sql` — no errors.

**Step 4: Commit**

```bash
git add libs/db/drizzle/
git commit -m "chore(db): add migration for nullable email and name"
```

---

## Task 3: Update better-auth config — remove fake email generation

**Files:**
- Modify: `apps/api/src/lib/auth.ts:47-66`

**Step 1: Remove `getTempEmail` from `signUpOnVerification`**

In `apps/api/src/lib/auth.ts`, update the `phoneNumber` plugin:

```typescript
phoneNumber({
  sendOTP: async ({ phoneNumber: phone, code }) => {
    const urlSuffix = `code=${code}&phone=${encodeURIComponent(phone)}`
    if (phone.startsWith('+0') || phone.includes('e2e')) {
      console.log('E2E test phone OTP', { phone, code })
      return
    }
    const result = await whatsAppService.sendText({
      to: phone.replace('+', ''),
      body: `Clique no link abaixo para acessar sua conta!\n\nhttp://localhost:4200/auth/verify-phone?${urlSuffix}`,
    })
    if (!result.success) {
      throw new Error('Failed to send WhatsApp OTP')
    }
  },
  signUpOnVerification: {
    // email is nullable, no temp email needed
  },
  phoneNumberValidator: phone => E164_PATTERN.test(phone),
}),
```

**Step 2: Run the API locally and test phone OTP signup manually**

```bash
npx nx run api:serve
```

Test: send OTP to a new phone number not in the DB. Verify the call to `/api/auth/phone-number/send-otp` succeeds and the verify call creates a user with `email = null`.

> **Risk:** If better-auth throws an error because `getTempEmail` is missing, use `getTempEmail: () => undefined as unknown as string` as a fallback. Then check the created user — if `email` is set to `"undefined"`, revisit and use `null as unknown as string`. The goal is no fake email in the DB.

**Step 3: Commit**

```bash
git add apps/api/src/lib/auth.ts
git commit -m "refactor(api): remove fake email generation for phone users"
```

---

## Task 4: Add `check-phone` and `check-email` backend endpoints

**Files:**
- Create: `apps/api/src/routes/auth-check.routes.ts`
- Modify: `apps/api/src/index.ts`

**Step 1: Write the failing test**

Create `apps/api/src/routes/auth-check.routes.test.ts` — but since this codebase doesn't have API route unit tests, skip the test file and rely on integration testing in Task 10.

**Step 2: Create the route file**

Create `apps/api/src/routes/auth-check.routes.ts`:

```typescript
import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

const checkPhoneSchema = z.object({
  phone: z.string().regex(E164_PATTERN, 'Invalid phone number'),
})

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email'),
})

router.get('/check-phone', async (req, res) => {
  const parsed = checkPhoneSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.phoneNumber, parsed.data.phone))
    .limit(1)
  return res.status(200).json({ exists: Boolean(user) })
})

router.get('/check-email', async (req, res) => {
  const parsed = checkEmailSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, parsed.data.email))
    .limit(1)
  return res.status(200).json({ exists: Boolean(user) })
})

export const authCheckRoutes = router
```

**Step 3: Register routes in `apps/api/src/index.ts`**

Add after the existing imports:
```typescript
import { authCheckRoutes } from './routes/auth-check.routes'
```

Add after `app.use(express.json())`:
```typescript
app.use('/api/auth-check', authCheckRoutes)
```

**Step 4: Verify manually**

```bash
# Phone not registered → { exists: false }
curl "http://localhost:3000/api/auth-check/check-phone?phone=%2B5511999999999"

# Invalid phone → 400
curl "http://localhost:3000/api/auth-check/check-phone?phone=invalid"
```

**Step 5: Commit**

```bash
git add apps/api/src/routes/auth-check.routes.ts apps/api/src/index.ts
git commit -m "feat(api): add check-phone and check-email endpoints"
```

---

## Task 5: Update login schemas — add name field

**Files:**
- Modify: `apps/web/src/schemas/login.schema.ts`
- Modify: `apps/web/src/schemas/login.schema.test.ts`

**Step 1: Write failing tests for name schema**

In `apps/web/src/schemas/login.schema.test.ts`, add a new describe block:

```typescript
describe('createNameSchema', () => {
  const schema = createNameSchema(mockT)

  it('accepts valid name', () => {
    expect(schema.safeParse({ name: 'John Doe' }).success).toBe(true)
  })

  it('trims whitespace before validating', () => {
    const result = schema.safeParse({ name: '  Ana  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Ana')
  })

  it('rejects empty name', () => {
    const result = schema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameRequired')
  })

  it('rejects whitespace-only name', () => {
    const result = schema.safeParse({ name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameTooShort')
  })

  it('rejects name shorter than 2 characters after trim', () => {
    const result = schema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameTooShort')
  })
})
```

**Step 2: Run tests to confirm they fail**

```bash
npx nx run web:test --testFile=src/schemas/login.schema.test.ts
```

Expected: FAIL — `createNameSchema` not defined.

**Step 3: Add `createNameSchema` to the schema file**

In `apps/web/src/schemas/login.schema.ts`:

```typescript
import type { TFunction } from 'i18next'
import { z } from 'zod'

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

export type LoginMode = 'phone' | 'email'

export function createPhoneLoginSchema(t: TFunction) {
  return z.object({
    phone: z
      .string()
      .min(1, { message: t('validation.phoneRequired') })
      .regex(E164_PATTERN, { message: t('validation.invalidPhone') }),
  })
}

export function createEmailLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('validation.emailRequired') })
      .email({ message: t('validation.invalidEmail') }),
  })
}

export function createNameSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(1, { message: t('validation.nameRequired') })
      .transform(s => s.trim())
      .refine(s => s.length >= 2, { message: t('validation.nameTooShort') }),
  })
}

export type PhoneFormData = z.infer<ReturnType<typeof createPhoneLoginSchema>>
export type EmailFormData = z.infer<ReturnType<typeof createEmailLoginSchema>>
export type NameFormData = z.infer<ReturnType<typeof createNameSchema>>
```

**Step 4: Run tests to confirm they pass**

```bash
npx nx run web:test --testFile=src/schemas/login.schema.test.ts
```

Expected: PASS for all tests including new ones.

**Step 5: Commit**

```bash
git add apps/web/src/schemas/login.schema.ts apps/web/src/schemas/login.schema.test.ts
git commit -m "feat(web): add name validation schema"
```

---

## Task 6: Add i18n keys for name field

**Files:**
- Modify: `apps/web/public/locales/en/auth.json`
- Modify: `apps/web/public/locales/pt-BR/auth.json`

**Step 1: Add name keys to English locale**

In `apps/web/public/locales/en/auth.json`, add to the `"validation"` object:

```json
"nameRequired": "Name is required",
"nameTooShort": "Name must be at least 2 characters"
```

Add to the `"login"` object:

```json
"nameLabel": "Your name",
"namePlaceholder": "Full name"
```

**Step 2: Add name keys to Portuguese locale**

In `apps/web/public/locales/pt-BR/auth.json`, add to `"validation"`:

```json
"nameRequired": "Nome é obrigatório",
"nameTooShort": "Nome deve ter pelo menos 2 caracteres"
```

Add to `"login"`:

```json
"nameLabel": "Seu nome",
"namePlaceholder": "Nome completo"
```

**Step 3: Commit**

```bash
git add apps/web/public/locales/
git commit -m "feat(web): add i18n keys for name field"
```

---

## Task 7: Create `useCheckIdentifier` utility hook

**Files:**
- Create: `apps/web/src/hooks/use-check-identifier.ts`

This hook abstracts the fetch call to the check endpoints and is easy to mock in tests.

**Step 1: Create the hook**

```typescript
import { clientEnv } from '@schedulizer/env/client'

interface CheckResult {
  exists: boolean
}

export async function checkPhoneExists(phone: string): Promise<boolean> {
  const url = `${clientEnv.apiUrl}/api/auth-check/check-phone?phone=${encodeURIComponent(phone)}`
  const response = await fetch(url)
  if (!response.ok) return false
  const data: CheckResult = await response.json()
  return data.exists
}

export async function checkEmailExists(email: string): Promise<boolean> {
  const url = `${clientEnv.apiUrl}/api/auth-check/check-email?email=${encodeURIComponent(email)}`
  const response = await fetch(url)
  if (!response.ok) return false
  const data: CheckResult = await response.json()
  return data.exists
}
```

**Step 2: Commit**

```bash
git add apps/web/src/hooks/use-check-identifier.ts
git commit -m "feat(web): add checkPhoneExists and checkEmailExists utilities"
```

---

## Task 8: Update `login.tsx` — add check + name field to both forms

**Files:**
- Modify: `apps/web/src/routes/auth/login.tsx`
- Modify: `apps/web/src/routes/auth/login.test.tsx`

This is the core UX change. The flow for both forms:
1. User fills identifier (phone or email)
2. On submit, call check endpoint
3. If `exists: false` → show name field in the same form
4. User fills name → submits again → sends OTP/magic link

**Step 1: Write failing tests**

Add to `apps/web/src/routes/auth/login.test.tsx`:

```typescript
// At top, add mock for check utilities
vi.mock('@/hooks/use-check-identifier', () => ({
  checkPhoneExists: vi.fn(),
  checkEmailExists: vi.fn(),
}))

import { checkPhoneExists, checkEmailExists } from '@/hooks/use-check-identifier'
const mockCheckPhone = vi.mocked(checkPhoneExists)
const mockCheckEmail = vi.mocked(checkEmailExists)
```

Add to `describe('phone mode (default)')`:

```typescript
it('shows name field when phone is new (registration)', async () => {
  const user = userEvent.setup()
  mockCheckPhone.mockResolvedValueOnce(false) // new user
  render(<MemoryRouter><LoginPage /></MemoryRouter>)
  const phoneInput = screen.getByTestId('phone-input')
  await user.clear(phoneInput)
  await user.type(phoneInput, '+5511999999999')
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => {
    expect(screen.getByTestId('name-input')).toBeInTheDocument()
  })
})

it('does NOT show name field when phone already exists (login)', async () => {
  const user = userEvent.setup()
  mockCheckPhone.mockResolvedValueOnce(true) // existing user
  mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
  render(<MemoryRouter><LoginPage /></MemoryRouter>)
  const phoneInput = screen.getByTestId('phone-input')
  await user.clear(phoneInput)
  await user.type(phoneInput, '+5511999999999')
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => {
    expect(screen.getByTestId('login-success')).toBeInTheDocument()
  })
  expect(screen.queryByTestId('name-input')).not.toBeInTheDocument()
})

it('requires name to be filled before sending OTP for new user', async () => {
  const user = userEvent.setup()
  mockCheckPhone.mockResolvedValueOnce(false)
  render(<MemoryRouter><LoginPage /></MemoryRouter>)
  const phoneInput = screen.getByTestId('phone-input')
  await user.clear(phoneInput)
  await user.type(phoneInput, '+5511999999999')
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument())
  // submit without name
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => {
    expect(screen.getByTestId('name-error')).toBeInTheDocument()
  })
  expect(mockSendOtp).not.toHaveBeenCalled()
})

it('stores name in sessionStorage and sends OTP for new user with name', async () => {
  const user = userEvent.setup()
  mockCheckPhone.mockResolvedValueOnce(false)
  mockSendOtp.mockResolvedValueOnce({ data: { success: true }, error: null })
  render(<MemoryRouter><LoginPage /></MemoryRouter>)
  const phoneInput = screen.getByTestId('phone-input')
  await user.clear(phoneInput)
  await user.type(phoneInput, '+5511999999999')
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => expect(screen.getByTestId('name-input')).toBeInTheDocument())
  await user.type(screen.getByTestId('name-input'), 'João Silva')
  await user.click(screen.getByTestId('submit-button'))
  await waitFor(() => {
    expect(mockSendOtp).toHaveBeenCalledWith({ phoneNumber: '+5511999999999' })
  })
  expect(sessionStorage.getItem('pendingName_+5511999999999')).toBe('João Silva')
})
```

Add similar tests for email mode.

**Step 2: Run tests to confirm they fail**

```bash
npx nx run web:test --testFile=src/routes/auth/login.test.tsx
```

Expected: FAIL — new tests fail.

**Step 3: Implement the updated `login.tsx`**

Replace `apps/web/src/routes/auth/login.tsx` with the new implementation:

```typescript
import { zodResolver } from '@hookform/resolvers/zod'
import { Alert, AlertDescription, Button, Card, Input, Label } from '@igortullio-ui/react'
import { CheckCircle2, Loader2, Mail, Phone } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { PhoneInput } from '@/components/phone-input'
import { authClient, signIn, useSession } from '@/lib/auth-client'
import { checkEmailExists, checkPhoneExists } from '@/hooks/use-check-identifier'
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
      <div className="mt-4 text-center">
        <button
          type="button"
          onClick={() => setMode(mode === 'phone' ? 'email' : 'phone')}
          className="text-sm text-muted-foreground underline hover:text-foreground"
          data-testid="switch-mode"
        >
          {mode === 'phone' ? t('login.switchToEmail') : t('login.switchToWhatsApp')}
        </button>
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
      onSubmit={
        formState === 'needs-name'
          ? handleNameSubmit(handleNameAndSend)
          : handlePhoneSubmit(handlePhoneCheck)
      }
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
      onSubmit={
        formState === 'needs-name'
          ? handleNameSubmit(handleNameAndSend)
          : handleEmailSubmit(handleEmailCheck)
      }
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
```

**Step 4: Update existing tests to mock `checkPhoneExists`/`checkEmailExists`**

Existing tests that call `sendOtp` directly (e.g., `'calls phoneNumber.sendOtp with correct params'`) now need `mockCheckPhone.mockResolvedValueOnce(true)` before the phone submit to simulate an existing user. Update all such tests.

For the test `'calls signIn.magicLink with correct parameters'`, add `mockCheckEmail.mockResolvedValueOnce(true)` before submit.

**Step 5: Run all login tests**

```bash
npx nx run web:test --testFile=src/routes/auth/login.test.tsx
```

Expected: PASS for all tests.

**Step 6: Commit**

```bash
git add apps/web/src/routes/auth/login.tsx apps/web/src/routes/auth/login.test.tsx apps/web/src/hooks/use-check-identifier.ts
git commit -m "feat(web): add registration detection and name collection to login forms"
```

---

## Task 9: Update `verify-phone.tsx` — apply pending name after OTP verification

**Files:**
- Modify: `apps/web/src/routes/auth/verify-phone.tsx`

**Step 1: Update the verify logic**

After a successful phone verification, read the pending name from `sessionStorage` and call `updateUser`:

```typescript
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
        const pendingName = sessionStorage.getItem(`pendingName_${phone}`)
        if (pendingName) {
          sessionStorage.removeItem(`pendingName_${phone}`)
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
  }, [code, phone, navigate, t])
  // ... rest of the render (unchanged)
}
```

Keep the rest of the render logic (loading/error/success states) identical to the current implementation.

**Step 2: Commit**

```bash
git add apps/web/src/routes/auth/verify-phone.tsx
git commit -m "feat(web): apply pending name after phone OTP verification"
```

---

## Task 10: Update `verify.tsx` — apply name from callbackURL after magic link

**Files:**
- Modify: `apps/web/src/routes/auth/verify.tsx`

**Step 1: Read `name` from search params and call `updateUser`**

In `apps/web/src/routes/auth/verify.tsx`, update `verifyMagicLink`:

```typescript
const token = searchParams.get('token')
const redirect = searchParams.get('redirect')
const name = searchParams.get('name')   // ← add this

// inside verifyMagicLink, after checking response.error:
setVerifyState('success')
if (name) {
  await authClient.updateUser({ name: decodeURIComponent(name) })
}
const orgSelectUrl = redirect
  ? `/auth/org-select?redirect=${encodeURIComponent(redirect)}`
  : '/auth/org-select'
navigate(orgSelectUrl, { replace: true })
```

**Step 2: Commit**

```bash
git add apps/web/src/routes/auth/verify.tsx
git commit -m "feat(web): apply name from magic link callbackURL after verification"
```

---

## Task 11: Run full validation

**Step 1: Run all affected tests**

```bash
npx nx affected -t lint typecheck test
```

Expected: All pass. Fix any TypeScript errors (likely from `authClient.updateUser` typing or nullable `name` in `User` type).

**Step 2: Manual E2E check — phone flow (new user)**

1. Open `http://localhost:4200/auth/login`
2. Enter a phone not in the DB
3. Confirm name field appears
4. Fill name → submit
5. Open WhatsApp link → redirected to `/auth/org-select`
6. Check DB: `SELECT name, email, phone_number FROM users ORDER BY created_at DESC LIMIT 1`
7. Expected: `name = 'your name'`, `email = NULL`, `phone_number = '+55...'`

**Step 3: Manual E2E check — phone flow (existing user)**

1. Enter the same phone again
2. Confirm name field does NOT appear (direct OTP send)

**Step 4: Manual E2E check — email flow (new user)**

1. Switch to email mode
2. Enter an email not in the DB
3. Confirm name field appears
4. Fill name → submit
5. Open magic link from email
6. Check DB: `name = 'your name'`, `email = 'entered@email.com'`, `phone_number = NULL`

**Step 5: Final commit if any fixes were needed**

```bash
npx nx affected -t lint typecheck test
git add -p
git commit -m "fix(web): address typecheck issues from nullable user fields"
```
