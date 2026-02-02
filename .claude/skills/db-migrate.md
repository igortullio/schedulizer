# Database Migration Skill

Gera e aplica migrations do Drizzle automaticamente.

## Comandos

1. Gerar nova migration:
```bash
nx run db:generate
```

2. Aplicar migrations pendentes:
```bash
nx run db:migrate
```

3. Para gerar e aplicar em sequência:
```bash
nx run db:generate && nx run db:migrate
```

## Notas

- Certifique-se de que o PostgreSQL está rodando (docker-compose up -d)
- O arquivo .env deve conter DATABASE_URL configurado
- As migrations são salvas em libs/db/drizzle/
