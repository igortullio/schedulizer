# Booking UI Improvements — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add "book again" buttons, fix oversized language switcher, and add copy public URL to settings.

**Architecture:** Three independent UI changes across the booking flow and dashboard settings. All are frontend-only (React components + i18n + env validation).

**Tech Stack:** React, react-i18next, Tailwind CSS, Lucide icons, Zod (env validation)

---

## Task 1: Make VITE_WEB_URL required

**Files:**
- Modify: `libs/shared/env/src/client.ts`

**Step 1: Update Zod schema — remove `.optional()` from VITE_WEB_URL**

In `libs/shared/env/src/client.ts`, change line 5:

```typescript
// Before
VITE_WEB_URL: z.url().optional(),

// After
VITE_WEB_URL: z.url(),
```

**Step 2: Update `ParsedClientEnv` interface — change `webUrl` type**

In `libs/shared/env/src/client.ts`, change line 20:

```typescript
// Before
webUrl: string | undefined

// After
webUrl: string
```

**Step 3: Update fallback value in `clientEnv` export**

In `libs/shared/env/src/client.ts`, change line 75:

```typescript
// Before
webUrl: undefined,

// After
webUrl: '',
```

**Step 4: Update confirmation-screen to use `clientEnv.webUrl` instead of `window.location.origin`**

In `apps/web/src/features/booking/components/confirmation-screen.tsx`, add import and replace origin usage:

```typescript
// Add import
import { clientEnv } from '@schedulizer/env'

// Change line 24
// Before
const managementUrl = `${window.location.origin}${managementPath}`

// After
const managementUrl = `${clientEnv.webUrl}${managementPath}`
```

**Step 5: Run validations**

Run: `npx nx affected -t lint typecheck`

**Step 6: Commit**

```
feat(env): make VITE_WEB_URL required
```

---

## Task 2: Fix language switcher size in public layout

**Files:**
- Modify: `apps/web/src/components/language-selector.tsx`

**Step 1: Add optional `className` prop and remove `w-full` from default**

The `LanguageSelector` currently hardcodes `w-full` in the button className. Add a `className` prop so the parent can control width. The sidebar already needs `w-full`, so default stays `w-full` for backwards compatibility, but `PublicLayout` will override it.

In `apps/web/src/components/language-selector.tsx`:

```typescript
// Update interface
interface LanguageSelectorProps {
  isCollapsed?: boolean
  className?: string
}

// Update component signature
export function LanguageSelector({ isCollapsed = false, className }: LanguageSelectorProps) {

// Update button className — replace the hardcoded `w-full` with the className prop
<Button
  variant="ghost"
  onClick={handleToggleLanguage}
  className={`gap-3 py-2 text-sm font-medium text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground ${isCollapsed ? 'justify-center px-0' : 'justify-start px-3'} ${className ?? 'w-full'}`}
  data-testid="language-selector"
  aria-label="Select language"
>
```

**Step 2: Update `PublicLayout` to pass `className` to `LanguageSelector`**

In `apps/web/src/components/layout/public-layout.tsx`, line 35:

```typescript
// Before
<LanguageSelector />

// After
<LanguageSelector className="w-auto" />
```

**Step 3: Run validations**

Run: `npx nx affected -t lint typecheck`

**Step 4: Commit**

```
fix(web): reduce language selector click area in public layout
```

---

## Task 3: Add "book again" button to confirmation screen

**Files:**
- Modify: `apps/web/public/locales/en/booking.json`
- Modify: `apps/web/public/locales/pt-BR/booking.json`
- Modify: `apps/web/src/features/booking/components/confirmation-screen.tsx`
- Modify: `apps/web/src/routes/booking/index.tsx`

**Step 1: Add i18n keys for confirmation screen**

In `apps/web/public/locales/en/booking.json`, add to `confirmation` object:

```json
"bookAgain": "Book another appointment"
```

In `apps/web/public/locales/pt-BR/booking.json`, add to `confirmation` object:

```json
"bookAgain": "Fazer novo agendamento"
```

**Step 2: Add `onBookAgain` prop to `ConfirmationScreen`**

In `apps/web/src/features/booking/components/confirmation-screen.tsx`:

```typescript
// Add CalendarPlus to imports
import { CalendarCheck, CalendarPlus, Check, Copy } from 'lucide-react'

// Update interface
interface ConfirmationScreenProps {
  service: BookingService
  appointment: AppointmentResult
  slug: string
  customerName: string
  onBookAgain: () => void
}

// Update destructuring
export function ConfirmationScreen({ service, appointment, slug, customerName, onBookAgain }: ConfirmationScreenProps) {
```

**Step 3: Add the button after "Manage booking" button**

In the `<div className="space-y-3">` block, after the "Manage booking" `<Button>`, add:

```tsx
<Button
  variant="outline"
  onClick={onBookAgain}
  className="w-full"
  data-testid="book-again"
>
  <CalendarPlus className="h-4 w-4" aria-hidden="true" />
  {t('confirmation.bookAgain')}
</Button>
```

**Step 4: Add `handleBookAgain` in booking page and pass it down**

In `apps/web/src/routes/booking/index.tsx`, add a new handler function after `handleBackToSlots`:

```typescript
function handleBookAgain() {
  setSelectedService(null)
  setSelectedSlot(null)
  setCustomerName('')
  setStep('services')
}
```

Pass it to `ConfirmationScreen`:

```tsx
<ConfirmationScreen
  service={selectedService}
  appointment={appointmentResult}
  slug={slug}
  customerName={customerName}
  onBookAgain={handleBookAgain}
/>
```

**Step 5: Run validations**

Run: `npx nx affected -t lint typecheck`

**Step 6: Commit**

```
feat(web): add book again button to confirmation screen
```

---

## Task 4: Add "book again" button to manage page

**Files:**
- Modify: `apps/web/public/locales/en/booking.json`
- Modify: `apps/web/public/locales/pt-BR/booking.json`
- Modify: `apps/web/src/routes/booking/manage.tsx`

**Step 1: Add i18n keys for manage page**

In `apps/web/public/locales/en/booking.json`, add to `manage` object:

```json
"bookAgain": "Book new appointment"
```

In `apps/web/public/locales/pt-BR/booking.json`, add to `manage` object:

```json
"bookAgain": "Fazer novo agendamento"
```

**Step 2: Update manage page imports**

In `apps/web/src/routes/booking/manage.tsx`:

```typescript
// Add CalendarPlus to lucide imports
import { AlertTriangle, CalendarCheck, CalendarPlus, CalendarX, Loader2 } from 'lucide-react'

// Add Link to react-router-dom imports
import { Link, useParams } from 'react-router-dom'
```

**Step 3: Add the "book again" button below the action buttons**

In the details view return block, after the `{isActive ? (...) : null}` block (after line 197), add:

```tsx
<div className="mt-4">
  <Button variant="outline" asChild className="w-full" data-testid="book-again">
    <Link to={`/booking/${slug}`}>
      <CalendarPlus className="h-4 w-4" aria-hidden="true" />
      {t('manage.bookAgain')}
    </Link>
  </Button>
</div>
```

This button is always visible (after cancel, reschedule, or any status) since a customer may want to book a new service regardless.

**Step 4: Run validations**

Run: `npx nx affected -t lint typecheck`

**Step 5: Commit**

```
feat(web): add book again button to manage page
```

---

## Task 5: Add copy public booking URL to settings

**Files:**
- Modify: `apps/web/public/locales/en/settings.json`
- Modify: `apps/web/public/locales/pt-BR/settings.json`
- Modify: `apps/web/src/routes/dashboard/settings.tsx`

**Step 1: Add i18n keys**

In `apps/web/public/locales/en/settings.json`, add to `form` object:

```json
"publicBookingLink": "Public booking link",
"copyLink": "Copy link",
"linkCopied": "Copied!"
```

In `apps/web/public/locales/pt-BR/settings.json`, add to `form` object:

```json
"publicBookingLink": "Link público de agendamento",
"copyLink": "Copiar link",
"linkCopied": "Copiado!"
```

**Step 2: Add imports to settings page**

In `apps/web/src/routes/dashboard/settings.tsx`:

```typescript
// Add Check and Copy to lucide imports
import { Check, Copy, Loader2 } from 'lucide-react'

// Add clientEnv import
import { clientEnv } from '@schedulizer/env'
```

**Step 3: Add copy state and handler**

Inside `Component()`, add after the existing state declarations (around line 42):

```typescript
const [linkCopied, setLinkCopied] = useState(false)

async function handleCopyBookingLink() {
  try {
    const bookingUrl = `${clientEnv.webUrl}/booking/${slug}`
    await navigator.clipboard.writeText(bookingUrl)
    setLinkCopied(true)
    setTimeout(() => setLinkCopied(false), 2000)
  } catch (err) {
    console.error('Failed to copy booking link', {
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
```

**Step 4: Add the public booking link field in the form**

In the settings form, after the slug help text `<p>` (line 185) and before the timezone `<div>` (line 187), add:

```tsx
<div className="space-y-2">
  <Label>{t('form.publicBookingLink')}</Label>
  <div className="flex items-center gap-2">
    <Input
      value={`${clientEnv.webUrl}/booking/${slug}`}
      readOnly
      className="flex-1 bg-muted"
      data-testid="public-booking-link"
    />
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={handleCopyBookingLink}
      data-testid="copy-booking-link"
      aria-label={t('form.copyLink')}
    >
      {linkCopied ? (
        <Check className="h-4 w-4 text-green-600" aria-hidden="true" />
      ) : (
        <Copy className="h-4 w-4" aria-hidden="true" />
      )}
    </Button>
  </div>
</div>
```

**Step 5: Run validations**

Run: `npx nx affected -t lint typecheck`

**Step 6: Commit**

```
feat(web): add copy public booking URL to settings
```

---

## Task 6: Final validation

**Step 1: Run full affected checks**

Run: `npx nx affected -t lint typecheck test`

**Step 2: Fix any issues found**

**Step 3: Commit fixes if any**
