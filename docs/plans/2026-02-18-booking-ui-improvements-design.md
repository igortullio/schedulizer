# Booking UI Improvements

Three small UI improvements to the booking flow and dashboard.

## 1. "Book Another Appointment" Button

Add a button on all post-action screens so the client can start a new booking.

### Confirmation Screen (after booking)

- Add a third button "Book another appointment" (`outline` variant, `CalendarPlus` icon) below "Manage my booking"
- The button calls an `onBookAgain` callback that resets the booking wizard to the `services` step (clearing selected service, slot, and booking result)

### Manage Page (after cancel or reschedule)

- Add a "Book new appointment" button (`outline` variant, `CalendarPlus` icon) below existing action buttons
- Visible after a successful cancel and after a successful reschedule
- Navigates to `/booking/:slug` (the service listing page)

### i18n

New keys in both `pt-BR` and `en`:
- `confirmation.bookAgain`
- `manage.bookAgain`

## 2. Language Switcher Size Fix

The `LanguageSelector` in `PublicLayout` uses `w-full` and `justify-start`, making the click area span the full header width.

### Fix

- Remove `w-full` from the button so it shrinks to content width
- Keep the visual appearance (label, padding, font size) unchanged
- The button should remain right-aligned in the header flex layout
- Only affects the public layout context; sidebar behavior stays the same

## 3. Copy Public Booking URL

Add a read-only display of the full public booking URL with a copy button on the settings page.

### VITE_WEB_URL Required

- Make `VITE_WEB_URL` required (remove `.optional()` from Zod schema)
- Update `ParsedClientEnv` type: `webUrl: string` (not `string | undefined`)
- Remove the `undefined` fallback in the clientEnv export

### Settings Page

- Below the slug input, add a read-only field showing `${clientEnv.webUrl}/booking/${slug}`
- Copy-to-clipboard icon button with `Copy`/`Check` toggle animation (2-second reset), same pattern as `confirmation-screen.tsx`
- Label: "Public booking link" (localized)

### i18n

New keys in both `pt-BR` and `en`:
- `settings.publicBookingLink`
- `settings.copyLink` / `settings.linkCopied`
