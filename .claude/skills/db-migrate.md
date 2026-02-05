# Database Migration Skill

Generates and applies Drizzle migrations automatically.

## Commands

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

- Make sure PostgreSQL is running (`docker-compose up -d`)
- The .env file must have DATABASE_URL configured
- Migrations are saved in `libs/db/drizzle/`
