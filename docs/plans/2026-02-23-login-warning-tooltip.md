# Login Warning Tooltip Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the static duplicate-account warning on the login page with a tooltip triggered by an `Info` icon next to the switch-mode button.

**Architecture:** Merge the current switch-mode `<div>` (lines 82–91) and static warning `<div>` (lines 92–98) in `login.tsx` into a single `<div>` that contains both the switch-mode button and an `Info` icon wrapped in `Tooltip`/`TooltipTrigger`/`TooltipContent` from `@igortullio-ui/react`. The `data-testid="separate-accounts-warning"` moves to the `TooltipTrigger` button so the existing test continues to pass without changes.

**Tech Stack:** React, i18next, `@igortullio-ui/react` (Tooltip, TooltipContent, TooltipTrigger already used in project), lucide-react (`Info` already imported in login.tsx).

---

## Task 1: Replace static warning with tooltip in login page

**Files:**
- Modify: `apps/web/src/routes/auth/login.tsx:82-98`
- Modify: `apps/web/src/routes/auth/login.test.tsx:363-372`

### Step 1: Read both files to understand current state

```bash
# login.tsx lines 1-10 to check imports
# login.tsx lines 82-100 to see the exact current structure
# login.test.tsx lines 363-372 to see the existing test
```

### Step 2: Verify the existing test fails if we remove the static div

Before making changes, mentally confirm: the test at line 370 does `screen.getByTestId('separate-accounts-warning')`. This currently finds the static `<div>`. After the change it must find the `TooltipTrigger` button instead (same testid, different element). The test assertion `toBeInTheDocument()` will still pass.

**No test change needed** — the existing test already covers "the warning trigger is in the document". Run it first to confirm it's green:

```bash
npx nx test web --testFile=src/routes/auth/login.test.tsx --no-cache
```

Expected: all tests PASS (baseline).

### Step 3: Update `login.tsx`

**3a. Add Tooltip imports** to the `@igortullio-ui/react` import line (line 2):

Current:
```typescript
import { Alert, AlertDescription, Button, Card, Input, Label } from '@igortullio-ui/react'
```

New:
```typescript
import { Alert, AlertDescription, Button, Card, Input, Label, Tooltip, TooltipContent, TooltipTrigger } from '@igortullio-ui/react'
```

**3b. Replace lines 82–98** (the switch-mode div + static warning div) with a single merged div:

Remove this (lines 82–98):
```tsx
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
      <div
        className="mt-3 flex items-start gap-2 rounded-lg bg-muted/50 px-3 py-2"
        data-testid="separate-accounts-warning"
      >
        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden="true" />
        <p className="text-xs text-muted-foreground">{t('login.separateAccountsWarning')}</p>
      </div>
```

Replace with:
```tsx
      <div className="mt-4 flex items-center justify-center gap-1.5">
        <button
          type="button"
          onClick={() => setMode(mode === 'phone' ? 'email' : 'phone')}
          className="text-sm text-muted-foreground underline hover:text-foreground"
          data-testid="switch-mode"
        >
          {mode === 'phone' ? t('login.switchToEmail') : t('login.switchToWhatsApp')}
        </button>
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
      </div>
```

Note: `Info` is already imported from `lucide-react` — do NOT add a duplicate import.

### Step 4: Run tests

```bash
npx nx test web --testFile=src/routes/auth/login.test.tsx --no-cache
```

Expected: all tests PASS. The existing `separate-accounts-warning` test finds the `TooltipTrigger` button (same testid, still in the DOM).

### Step 5: Run lint and typecheck

```bash
npx nx lint web --no-cache
npx nx typecheck web --no-cache
```

Fix any issues found.

### Step 6: Commit

```bash
git add apps/web/src/routes/auth/login.tsx
git commit -m "feat(web): convert login duplicate-account warning to tooltip

Co-Authored-By: Claude Sonnet 4.6 <noreply@anthropic.com>"
```

Only `login.tsx` needs to be committed — no locale changes, no test changes.
