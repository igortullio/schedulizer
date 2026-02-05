# API (Backend)

Express.js v5 + TypeScript backend.

## Structure

- `src/routes/` - Express route handlers (`<name>.routes.ts`)
- `src/services/` - Business logic (`<name>.service.ts`)
- `src/middleware/` - Express middleware (`<name>.middleware.ts`)
- `src/lib/auth.ts` - better-auth configuration

## Patterns

- Always validate input with Zod
- Filter all queries by organizationId (multi-tenancy)
- Use correct HTTP status codes
- Return consistent format: `{ data: ... }` or `{ error: ... }`
- Authentication via magic link only (better-auth with organization + captcha)
- Email delivery via Resend
- Use `@schedulizer/env/server` (serverEnv) for environment variables

## Creating routes

Use the `/api-route` skill when creating a new API route.
