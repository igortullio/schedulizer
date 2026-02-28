# WhatsApp Auto-Enable by Plan

## Decision

Enable WhatsApp notifications automatically based on the organization's subscription plan. No manual toggle needed.

## Approach

Remove `organizationWhatsAppEnabled` parameter entirely. The `ChannelResolver` already checks `PLAN_CONFIGS[planType].notifications.whatsapp`, making the org-level flag redundant.

## Changes

### `libs/notifications/src/notification-types.ts`
- Remove `organizationWhatsAppEnabled` from `SendNotificationParams` and `ResolveChannelParams`

### `libs/notifications/src/channel-resolver.ts`
- Remove the `organizationWhatsAppEnabled` check
- Final logic: `!recipientPhone → email`, `!plan.whatsapp → email`, else `whatsapp`

### `libs/notifications/src/notification-service.ts`
- Stop passing `organizationWhatsAppEnabled` to the channel resolver

### `apps/api/src/routes/booking.routes.ts`
- Remove `organizationWhatsAppEnabled: false` from all `notificationService.send()` calls (6 occurrences)

### `apps/api/src/routes/notifications.routes.ts`
- Remove `organizationWhatsAppEnabled: false` from reminder notification call

### Tests
- Update `channel-resolver.spec.ts` to remove `organizationWhatsAppEnabled` from test cases
- Update any other test files referencing this field

## Not Needed
- No database migration (no new columns)
- No frontend changes (`WhatsAppGating` already works based on plan limits)
