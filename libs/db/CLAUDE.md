# Database

## Structure

- `src/schema.ts` - Drizzle table schemas
- `drizzle/` - Generated migration files

## Standards

- Store all timestamps in UTC
- Every table with user data must include organization_id for multi-tenancy

## Migrations

Use the @.claude/skills/db-migrate skill to generate and apply migrations.
