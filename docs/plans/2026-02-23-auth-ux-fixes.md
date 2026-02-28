# Auth UX Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix 3 auth UX issues: (1) bug that blocks new users from creating their first organization, (2) missing logout button on org-select page, (3) missing warning about duplicate accounts when using phone vs. email login.

**Architecture:**
- Task 1 is a backend fix in `member-limit-guard.ts`: allow the first member (owner) to be added without a subscription.
- Tasks 2 and 3 are frontend-only changes: add a `signOut` button to `org-select.tsx` and an informational note to `login.tsx`, with translations in both `en` and `pt-BR` locale files.

**Tech Stack:** Express.js (API), React + Vite + i18next (Web), better-auth, Vitest (tests), Nx monorepo.

---

## Task 1: Fix `checkMemberLimit` to allow the first member (owner) without subscription

**Root cause:** `checkMemberLimit` returns `allowed: false` when no subscription exists, even when adding the very first member (the org creator/owner). The `beforeAddMember` hook in `auth.ts` calls this function and throws `FORBIDDEN`, preventing organization creation.

**Fix:** When no subscription is found, query the current member count. If count is 0 (owner is being added), allow it. If count > 0, block.

**Files:**
- Modify: `apps/api/src/lib/member-limit-guard.ts`
- Modify: `apps/api/src/lib/__tests__/member-limit-guard.test.ts`

### Step 1: Update test helper to support member count for null-subscription case

In `member-limit-guard.test.ts`, the `setupSubscriptionAndMemberCount` helper currently returns early and does not mock the member count query when subscription is null. Update it so the count mock is always set up:

```typescript
function setupSubscriptionAndMemberCount(subscription: MockSubscription | null, memberCount: number) {
  mockDbSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue(Promise.resolve(subscription === null ? [] : [subscription])),
      }),
    }),
  })
  if (subscription === null) {
    mockDbSelect.mockReturnValueOnce({
      from: vi.fn().mockReturnValue({
        where: vi.fn().mockReturnValue(Promise.resolve([{ value: memberCount }])),
      }),
    })
    return
  }
  mockDbSelect.mockReturnValueOnce({
    from: vi.fn().mockReturnValue({
      where: vi.fn().mockReturnValue(Promise.resolve([{ value: memberCount }])),
    }),
  })
}
```

### Step 2: Update existing test — no subscription + 0 members → now allowed

Change the existing `'should block when no subscription found'` test (line 146–162) to reflect new behavior: 0 members with no subscription → allowed (owner creating their org).

Add a new test for the blocking case (no subscription + members already exist):

```typescript
describe('Fail-safe Behavior', () => {
  it('should allow when no subscription found but org has no members yet (owner creation)', async () => {
    setupSubscriptionAndMemberCount(null, 0)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const result = await checkMemberLimit('org-123')
    expect(result.allowed).toBe(true)
    consoleSpy.mockRestore()
  })

  it('should block when no subscription found and org already has members', async () => {
    setupSubscriptionAndMemberCount(null, 1)
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    const result = await checkMemberLimit('org-123')
    expect(result.allowed).toBe(false)
    expect(result.reason).toBe('no_subscription')
    expect(consoleSpy).toHaveBeenCalledWith(
      'Plan limit enforcement triggered',
      expect.objectContaining({
        organizationId: 'org-123',
        resource: 'members',
        reason: 'no_subscription',
        action: 'blocked',
      }),
    )
    consoleSpy.mockRestore()
  })
  // ... keep remaining tests unchanged
})
```

### Step 3: Run test to confirm it fails

```bash
npx nx test api --testFile=src/lib/__tests__/member-limit-guard.test.ts --no-cache
```

Expected: `'should allow when no subscription found but org has no members yet'` FAILS.

### Step 4: Update `checkMemberLimit` implementation

Replace the early-return block in `member-limit-guard.ts` (lines 26–34) with logic that queries member count first when no subscription found:

```typescript
export async function checkMemberLimit(organizationId: string): Promise<MemberLimitResult> {
  const subscription = await db
    .select({
      stripePriceId: schema.subscriptions.stripePriceId,
      status: schema.subscriptions.status,
    })
    .from(schema.subscriptions)
    .where(eq(schema.subscriptions.organizationId, organizationId))
    .limit(1)
  const [memberCount] = await db
    .select({ value: count() })
    .from(schema.members)
    .where(eq(schema.members.organizationId, organizationId))
  const currentCount = memberCount?.value ?? 0
  if (subscription.length === 0) {
    if (currentCount === 0) {
      return { allowed: true }
    }
    console.log('Plan limit enforcement triggered', {
      organizationId,
      resource: 'members',
      reason: 'no_subscription',
      action: 'blocked',
    })
    return { allowed: false, reason: 'no_subscription' }
  }
  let resolvedPlan = resolvePlanFromSubscription({
    stripePriceId: subscription[0].stripePriceId,
    status: subscription[0].status,
  })
  if (!resolvedPlan) {
    console.error('Failed to resolve plan type from stripePriceId', {
      organizationId,
      stripePriceId: subscription[0].stripePriceId,
      fallback: 'essential',
    })
    resolvedPlan = {
      type: 'essential',
      limits: getPlanLimits('essential'),
      stripePriceId: subscription[0].stripePriceId ?? '',
    }
  }
  if (currentCount >= resolvedPlan.limits.maxMembers) {
    console.log('Plan limit enforcement triggered', {
      organizationId,
      resource: 'members',
      planType: resolvedPlan.type,
      currentCount,
      limit: resolvedPlan.limits.maxMembers,
      action: 'blocked',
    })
    return {
      allowed: false,
      reason: 'limit_exceeded',
      current: currentCount,
      limit: resolvedPlan.limits.maxMembers,
      planType: resolvedPlan.type,
    }
  }
  return { allowed: true, current: currentCount, limit: resolvedPlan.limits.maxMembers, planType: resolvedPlan.type }
}
```

Note: `memberCount` query is now moved up (before the subscription check) so it's reused in both branches.

### Step 5: Run tests to confirm they pass

```bash
npx nx test api --testFile=src/lib/__tests__/member-limit-guard.test.ts --no-cache
```

Expected: all tests PASS.

### Step 6: Run full affected checks

```bash
npx nx affected -t lint typecheck test --base=HEAD~1
```

Expected: no errors.

### Step 7: Commit

```bash
git add apps/api/src/lib/member-limit-guard.ts apps/api/src/lib/__tests__/member-limit-guard.test.ts
git commit -m "fix(api): allow org owner to be added without subscription on creation"
```

---

## Task 2: Add logout button to `/auth/org-select`

**Files:**
- Modify: `apps/web/src/routes/auth/org-select.tsx`
- Modify: `apps/web/public/locales/en/auth.json`
- Modify: `apps/web/public/locales/pt-BR/auth.json`
- Modify: `apps/web/src/routes/auth/org-select.test.tsx` (add test)

### Step 1: Add translation keys for logout

In `apps/web/public/locales/en/auth.json`, inside `"orgSelect"`:

```json
"signOut": "Sign out"
```

In `apps/web/public/locales/pt-BR/auth.json`, inside `"orgSelect"`:

```json
"signOut": "Sair"
```

### Step 2: Write failing test

Open `apps/web/src/routes/auth/org-select.test.tsx`. Check what mocking pattern is used.

Add a test that renders the component with organizations and verifies the sign-out button is present and calls `signOut` when clicked. The test should mock `@/lib/auth-client` to expose a `signOut` spy.

```typescript
it('should render a sign-out button and call signOut when clicked', async () => {
  const signOutMock = vi.fn().mockResolvedValue({})
  vi.mocked(authClient).useListOrganizations.mockReturnValue({
    data: [{ id: 'org-1', name: 'Acme', logo: null }],
    isPending: false,
    error: null,
  } as never)
  // mock signOut on auth module
  vi.mock('@/lib/auth-client', async (importOriginal) => {
    const actual = await importOriginal()
    return { ...actual, signOut: signOutMock }
  })
  render(<Component />, { wrapper: createWrapper() })
  const signOutButton = screen.getByTestId('sign-out-button')
  expect(signOutButton).toBeInTheDocument()
  await userEvent.click(signOutButton)
  expect(signOutMock).toHaveBeenCalledOnce()
})
```

### Step 3: Run test to confirm it fails

```bash
npx nx test web --testFile=src/routes/auth/org-select.test.tsx --no-cache
```

Expected: FAIL — `sign-out-button` not found.

### Step 4: Add sign-out button to `org-select.tsx`

Import `signOut` from auth-client at the top of the file:

```typescript
import { authClient, signOut } from '@/lib/auth-client'
```

Add a `handleSignOut` function inside the `Component` function:

```typescript
async function handleSignOut() {
  await signOut()
}
```

Add the sign-out button below the `<Card>` in the main return (the one with org list). It should be a small, subtle text link placed below the card — outside of it — so it appears in all states. Add it to every early-return render path (loading, error, create form, list).

The pattern: wrap each return's content in a fragment and append the sign-out link below the Card:

```tsx
return (
  <>
    <Card className="p-8" data-testid="org-select-list">
      {/* ... existing content ... */}
    </Card>
    <div className="mt-4 text-center">
      <button
        type="button"
        onClick={handleSignOut}
        className="text-sm text-muted-foreground underline hover:text-foreground"
        data-testid="sign-out-button"
      >
        {t('orgSelect.signOut')}
      </button>
    </div>
  </>
)
```

Apply the same `<>...</> + sign-out div` pattern to the loading, fetchError, and CreateOrganizationForm early returns as well. This ensures sign-out is always accessible.

### Step 5: Run test to confirm it passes

```bash
npx nx test web --testFile=src/routes/auth/org-select.test.tsx --no-cache
```

Expected: all tests PASS.

### Step 6: Verify visually with Playwright

```bash
# Script already in /tmp from investigation
# Navigate to http://localhost:4200/auth/org-select and take screenshot
```

Run the Playwright skill to verify the sign-out button appears visually.

### Step 7: Run full checks

```bash
npx nx affected -t lint typecheck test --base=HEAD~1
```

### Step 8: Commit

```bash
git add apps/web/src/routes/auth/org-select.tsx \
        apps/web/src/routes/auth/org-select.test.tsx \
        apps/web/public/locales/en/auth.json \
        apps/web/public/locales/pt-BR/auth.json
git commit -m "feat(web): add sign-out button to org-select page"
```

---

## Task 3: Add duplicate account warning on login page

**Files:**
- Modify: `apps/web/src/routes/auth/login.tsx`
- Modify: `apps/web/public/locales/en/auth.json`
- Modify: `apps/web/public/locales/pt-BR/auth.json`
- Modify: `apps/web/src/routes/auth/login.test.tsx` (add test)

### Step 1: Add translation keys

In `apps/web/public/locales/en/auth.json`, inside `"login"`:

```json
"separateAccountsWarning": "Using phone and email creates separate accounts. You can link them after signing in."
```

In `apps/web/public/locales/pt-BR/auth.json`, inside `"login"`:

```json
"separateAccountsWarning": "Usar telefone e e-mail cria contas separadas. É possível vinculá-las após entrar."
```

### Step 2: Write failing test

In `apps/web/src/routes/auth/login.test.tsx`, add a test that verifies the warning text is visible on the login page:

```typescript
it('should display separate accounts warning', () => {
  render(<Component />, { wrapper: createWrapper() })
  expect(screen.getByTestId('separate-accounts-warning')).toBeInTheDocument()
})
```

### Step 3: Run test to confirm it fails

```bash
npx nx test web --testFile=src/routes/auth/login.test.tsx --no-cache
```

Expected: FAIL — `separate-accounts-warning` not found.

### Step 4: Add the warning note to `login.tsx`

Import `Info` from `lucide-react` at the top of the file (add to existing lucide import line).

Inside the `Component` function return, after the switch-mode button `<div>` (around line 91), add:

```tsx
<div className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2" data-testid="separate-accounts-warning">
  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
  <p className="text-xs text-muted-foreground">{t('login.separateAccountsWarning')}</p>
</div>
```

This goes inside the outer `<Card className="p-8">` return, after the switch-mode `<div>`.

### Step 5: Run test to confirm it passes

```bash
npx nx test web --testFile=src/routes/auth/login.test.tsx --no-cache
```

Expected: all tests PASS.

### Step 6: Run full checks

```bash
npx nx affected -t lint typecheck test --base=HEAD~1
```

### Step 7: Commit

```bash
git add apps/web/src/routes/auth/login.tsx \
        apps/web/src/routes/auth/login.test.tsx \
        apps/web/public/locales/en/auth.json \
        apps/web/public/locales/pt-BR/auth.json
git commit -m "feat(web): add duplicate account warning on login page"
```

---

## Final verification

After all 3 tasks, run the full check to ensure nothing is broken:

```bash
npx nx affected -t lint typecheck test --base=main
```

Then use Playwright to do a visual smoke-test of:
1. `/auth/login` — warning note visible
2. `/auth/org-select` — sign-out button visible
3. Full org creation flow (if testable with E2E credentials)
