---
name: db-migrate
description: Generate and apply Drizzle ORM database migrations. Use when the user changes database schemas, asks to create or run migrations, or mentions "/db-migrate".
---

# Database Migration

Generate and apply Drizzle migrations for PostgreSQL.

1. Generate new migration:
```bash
nx run db:generate
```

2. Apply pending migrations:
```bash
nx run db:migrate
```

3. Generate and apply in sequence:
```bash
nx run db:generate && nx run db:migrate
```

## Notes

- PostgreSQL must be running (`docker-compose up -d`)
- Requires DATABASE_URL in .env
- Migrations are saved in `libs/db/drizzle/`
