# Auth & User Table Improvements — Design

**Date:** 2026-02-23
**Branch:** `igortullio/whatsapp`
**Status:** Approved

## Problem

The `users` table has two issues:

1. **`name` field**: NOT NULL in the schema but never collected from users during the phone OTP flow — better-auth generates the phone number as the name by default.
2. **`email` field**: NOT NULL in the schema, but phone-flow users receive a fake generated email (`5511999999@phone.schedulizer.me`) that pollutes the database.

## Goals

- Collect user name during registration for both phone and email flows
- Remove fake email generation; make `email` nullable for phone users
- Validate name (no blank/empty values)
- Allow phone users to optionally add email later (in settings)

## Decision

**Email:** Make nullable in DB. Phone users have `email = null`. Multiple null values are allowed (PostgreSQL unique constraint ignores NULLs).

**Name:** Make nullable in DB (required by better-auth lifecycle for magic link), but always collected via app flow. Display `"Usuário"` as fallback if somehow null.

**Both flows share the same UX pattern:** on the login page, before sending OTP/magic link, check if the identifier (phone or email) exists. If new user → show name field inline.

## Architecture

### Database Schema (`libs/db/src/schema.ts`)

```typescript
export const users = pgTable('users', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),                    // nullable - app enforces via flow
  email: text('email').unique(),         // nullable - phone users have null
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  phoneNumber: text('phone_number').unique(),
  phoneNumberVerified: boolean('phone_number_verified').notNull().default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
```

### New API Endpoints (`apps/api/src/routes/auth.routes.ts`)

```
GET /auth/check-phone?phone=+5511999999  → { exists: boolean }
GET /auth/check-email?email=user@x.com  → { exists: boolean }
```

Both endpoints only return existence — no user data exposed.

### Backend Auth Config (`apps/api/src/lib/auth.ts`)

Remove `getTempEmail` from `signUpOnVerification`:

```typescript
phoneNumber({
  sendOTP: async ({ phoneNumber: phone, code }) => { ... },
  signUpOnVerification: {
    // No getTempEmail → email stays null for phone users
    // Name is passed in verify request body (natively supported)
  },
})
```

### Login Page Flow (`apps/web/src/routes/auth/login.tsx`)

```
User types phone/email
         ↓
  [Continue] clicked
         ↓
  GET /auth/check-phone (or check-email)
         ↓
exists? ──YES──→ send OTP/magic link
         │
         NO
         ↓
  Show name field inline (same page)
         ↓
  User fills name
         ↓
  [Continue] clicked
         ↓
  send OTP/magic link
```

### Phone Verification (`apps/web/src/routes/auth/verify-phone.tsx`)

```typescript
authClient.phoneNumber.verify({
  phoneNumber: phone,
  code,
  name: nameFromState,  // better-auth supports additional fields in verify body
})
```

### Email Verification — Cross-Device Strategy

Name is encoded in the `callbackURL` of the magic link, so it survives across devices:

```typescript
// login.tsx — when sending magic link for new user
const callbackURL = name
  ? `/auth/verify?name=${encodeURIComponent(name)}&redirect=${redirect}`
  : `/auth/verify?redirect=${redirect}`

signIn.magicLink({ email, callbackURL })
```

```typescript
// auth/verify.tsx — after successful verification
const name = searchParams.get('name')
if (name) {
  await authClient.updateUser({ name: decodeURIComponent(name) })
}
navigate(redirect ?? '/dashboard', { replace: true })
```

### Name Validation

**Frontend (Zod):**
```typescript
name: z.string()
  .trim()
  .min(2, t('validation.nameTooShort'))
```

**Backend (auth-check endpoints):** No name validation needed here.

**Note:** A DB-level check constraint for name could be added as an extra safety net but is optional given the complexity of migrating existing blank names.

## Files Changed

| File | Change |
|---|---|
| `libs/db/src/schema.ts` | `email` and `name` become nullable |
| `libs/db/drizzle/` | New migration (0009) |
| `apps/api/src/lib/auth.ts` | Remove `getTempEmail` from phone plugin |
| `apps/api/src/routes/auth.routes.ts` | Add `check-phone` and `check-email` endpoints |
| `apps/api/src/index.ts` | Register auth routes (if new file) |
| `apps/web/src/routes/auth/login.tsx` | Check existence → show name field conditionally |
| `apps/web/src/routes/auth/verify-phone.tsx` | Pass name in verify body |
| `apps/web/src/routes/auth/verify.tsx` | Read name from URL, call updateUser |
| `apps/web/src/schemas/login.schema.ts` | Add name field validation |
| `apps/web/public/locales/` | New i18n keys for name field |

## Risks & Mitigations

| Risk | Mitigation |
|---|---|
| better-auth rejects null email | Test immediately — fallback: keep email NOT NULL with placeholder |
| better-auth `signUpOnVerification` requires `getTempEmail` | If so, pass `getTempEmail: () => null` or use `databaseHooks.user.create` |
| Name URL param in callbackURL is lost | Edge case only if URL is truncated; name remains null → UI shows "Usuário" fallback |
| Existing users with blank names | Out of scope — handle separately with a data migration if needed |
