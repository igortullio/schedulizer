# Architecture Overview - Schedulizer

## Overview

Schedulizer is a modern SaaS scheduling platform for small businesses. The system follows a modular monorepo architecture managed by [Nx](https://nx.dev), with clear separation between applications, shared libraries, and infrastructure.

This document provides a high-level introduction to the architecture and serves as a navigation hub to detailed guidelines.

## Monorepo Structure

```
schedulizer/
├── apps/
│   ├── api/              # Backend REST API
│   ├── web/              # SaaS dashboard (authenticated)
│   └── landing/          # Marketing landing page (public)
├── libs/
│   ├── db/               # Database schemas, migrations, and client
│   ├── billing/          # Stripe integration wrapper
│   └── shared/
│       ├── env/          # Environment validation (server + client)
│       └── types/        # Shared TypeScript types and Zod schemas
├── nx.json               # Nx workspace configuration
├── tsconfig.base.json    # Base TypeScript config with path aliases
├── biome.json            # Linting and formatting rules
└── docker-compose.yml    # Local PostgreSQL instance
```

## Applications

### API (`apps/api`)

The backend is an Express.js v5 application built with TypeScript.

| Aspect | Detail |
|--------|--------|
| Framework | Express.js v5 |
| Auth | better-auth (magic link only, no passwords) |
| Email | Resend |
| Billing | Stripe SDK via `@schedulizer/billing` |
| Validation | Zod schemas from `@schedulizer/shared-types` |
| Build | esbuild (bundles to a single CJS file) |
| Runtime | Node.js 22 |

**Route structure:**

```
src/
├── routes/               # Express route handlers (*.routes.ts)
├── middlewares/           # Auth, subscription verification
├── services/             # Business logic
├── lib/
│   ├── auth.ts           # better-auth configuration
│   └── validation/       # Input validation schemas
└── index.ts              # App entrypoint and route registration
```

**Key endpoints:**

| Path | Purpose |
|------|---------|
| `/api/auth/*` | Authentication (magic link) |
| `/api/billing` | Payments and Stripe webhooks |
| `/api/organizations` | Multi-tenancy management |
| `/api/services` | Service CRUD |
| `/api/services/:serviceId/schedules` | Weekly availability |
| `/api/appointments` | Appointment management |
| `/api/time-blocks` | Calendar blocking |
| `/api/booking` | Public booking page API |
| `/api/notifications` | Email reminders (cron) |
| `/api/leads` | Landing page lead capture |

### Web (`apps/web`)

The SaaS dashboard is a React SPA for authenticated business users.

| Aspect | Detail |
|--------|--------|
| Framework | React 19 |
| Bundler | Vite |
| Styling | Tailwind CSS v4 + Shadcn |
| Routing | React Router v7 (lazy code splitting) |
| i18n | i18next (pt-BR, en) |
| Calendar | react-big-calendar |
| UI Library | @igortullio-ui/react |

**Feature-based structure:**

```
src/features/
├── appointments/         # Dashboard with calendar view
├── services/             # Service CRUD
├── schedules/            # Weekly schedule config
├── time-blocks/          # Time blocking
├── booking/              # Public booking page
├── billing/              # Subscription management
└── settings/             # Organization settings
```

### Landing (`apps/landing`)

A public-facing marketing page with lead capture form. Uses the same stack as the web app (React + Vite + Tailwind) but without authentication. Supports i18n (pt-BR, en) and optional Turnstile captcha.

## Shared Libraries

### Database (`libs/db`)

Centralized database layer using Drizzle ORM with PostgreSQL.

| Aspect | Detail |
|--------|--------|
| ORM | Drizzle ORM |
| Database | PostgreSQL 16 |
| Migrations | SQL files via `drizzle-kit` |
| Import | `@schedulizer/db` |

**Schema overview:**

| Group | Tables |
|-------|--------|
| Auth | `users`, `sessions`, `accounts`, `verifications` |
| Organization | `organizations`, `members`, `invitations` |
| Core domain | `services`, `schedules`, `schedulePeriods`, `appointments`, `timeBlocks` |
| Billing | `subscriptions` |
| Marketing | `leads` |

**Key conventions:**
- All timestamps stored in UTC
- Every table includes `organizationId` for multi-tenancy isolation
- Indexes on frequently queried columns

**Nx targets:**

```bash
npx nx run db:generate   # Generate migration from schema changes
npx nx run db:migrate    # Apply pending migrations
npx nx run db:studio     # Open Drizzle Studio UI
```

### Billing (`libs/billing`)

Stripe integration wrapper exposing checkout, portal, subscription management, and webhook verification.

| Aspect | Detail |
|--------|--------|
| Provider | Stripe SDK v17 |
| Import | `@schedulizer/billing` |
| Pattern | Singleton (`getStripeClient()`) |
| Error handling | `BillingResult<T>` (success/error) |

### Shared Environment (`libs/shared/env`)

Zod-validated environment variables with separate schemas for server and client contexts.

| Export | Purpose | Prefix |
|--------|---------|--------|
| `@schedulizer/env/server` | Backend-only variables | None |
| `@schedulizer/env/client` | Frontend-exposed variables | `VITE_` |

### Shared Types (`libs/shared/types`)

TypeScript interfaces and Zod validation schemas shared between apps.

| Export | Purpose |
|--------|---------|
| Interfaces | `User`, `Organization`, `Service`, `Appointment`, etc. |
| Zod schemas | `CreateServiceSchema`, `UpsertScheduleSchema`, etc. |
| Enums | `AppointmentStatus` (pending, confirmed, cancelled, completed, no_show) |

## Dependency Graph

```
apps/api ──────► libs/db
  │              libs/billing
  │              libs/shared/env (server)
  │              libs/shared/types
  │
apps/web ──────► libs/shared/env (client)
  │              libs/shared/types
  │
apps/landing ──► libs/shared/env (client)
                 libs/shared/types
```

Path aliases are defined in `tsconfig.base.json`:

```
@schedulizer/db           → libs/db/src/index.ts
@schedulizer/billing      → libs/billing/src/index.ts
@schedulizer/shared-types → libs/shared/types/src/index.ts
@schedulizer/env/server   → libs/shared/env/src/server.ts
@schedulizer/env/client   → libs/shared/env/src/client.ts
```

## Cross-Cutting Concerns

### Multi-Tenancy

Every user belongs to an organization. All data queries are filtered by `organizationId`, ensuring complete tenant isolation at the database level. Organizations have a unique slug used for public booking URLs.

### Authentication

Authentication uses better-auth with magic links (no passwords). The flow is:

1. User enters email
2. API sends a magic link via Resend
3. User clicks the link to authenticate
4. Session is stored in the database (`sessions` table)

The organization plugin enables multi-tenancy with members and invitations.

### Subscription & Billing

Stripe handles all payment processing. The `requireSubscription` middleware blocks access to non-essential routes when an organization lacks an active subscription. Stripe webhooks keep the local `subscriptions` table in sync.

### API Response Format

All endpoints follow a consistent response format:

```json
// Success
{ "data": { ... } }

// Error
{ "error": { "message": "...", "code": "..." } }
```

### Internationalization

Both frontend apps (web and landing) use i18next with namespace-based JSON files supporting Portuguese (pt-BR) and English (en).

## Infrastructure

### Local Development

```bash
docker-compose up -d     # Start PostgreSQL 16
npx nx run db:migrate    # Apply migrations
npx nx run api:serve     # Start API (port 3000)
npx nx run web:serve     # Start web (port 4200)
npx nx run landing:serve # Start landing page
```

### Docker

Each app has a multi-stage Dockerfile:

| App | Builder | Runner | Port |
|-----|---------|--------|------|
| API | Node 22 Alpine | Node 22 Alpine | 3000 |
| Web | Node 22 Alpine | Nginx | 80 |
| Landing | Node 22 Alpine | Nginx | 80 |

### CI/CD

GitHub Actions automates validation and builds:

| Workflow | Trigger | Purpose |
|----------|---------|---------|
| CI (`ci.yml`) | Pull requests | Lint, typecheck, test (uses `nx affected`) |
| CD (`cd.yml`) | Push to `main` | Production build + artifact upload |
| Cron (`send-reminders.yml`) | Every 15 min | Appointment email reminders |

### Deployment

Production runs on Coolify with PostgreSQL, serving:

| Domain | App |
|--------|----|
| `schedulizer.me` | Landing page |
| `api.schedulizer.me` | API |
| `app.schedulizer.me` | Web dashboard |

## Code Quality

| Tool | Purpose |
|------|---------|
| Biome | Linting and formatting (single quotes, 2-space indent, 120 char width) |
| TypeScript | Strict type checking |
| Vitest | Unit and integration tests |
| commitlint | Conventional commit message validation |
| lint-staged | Pre-commit formatting |

## Related Documentation

- [CI/CD Pipeline](./CI_CD.md) - Workflow configuration, secrets, and troubleshooting
- [Deployment Guide](./DEPLOY.md) - Coolify deployment steps and environment setup
- [Branch Protection](./BRANCH_PROTECTION.md) - Protected branch rules and validation
