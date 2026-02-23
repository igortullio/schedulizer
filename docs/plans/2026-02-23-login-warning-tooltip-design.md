# Login Warning Tooltip Design

**Goal:** Replace the static duplicate-account warning on the login page with a tooltip triggered by an `Info` icon next to the switch-mode button.

**Approach:** Keep the switch-mode button unchanged. Add a small `Info` icon inline to its right. Wrap it in `Tooltip`/`TooltipTrigger`/`TooltipContent` from `@igortullio-ui/react` (already used in the project). The tooltip content shows the existing `login.separateAccountsWarning` translation key. Remove the old static `<div>`.

**Components:** `Tooltip`, `TooltipContent`, `TooltipTrigger` from `@igortullio-ui/react`; `Info` from `lucide-react` (already imported).

**Test:** Update the existing `separate-accounts-warning` test to query the `TooltipContent` element instead of the old static div.
