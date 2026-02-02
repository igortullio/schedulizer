# New Feature Skill

Template para criar nova feature seguindo os padrões do projeto.

## Estrutura de Feature

### Backend (apps/api)

1. **Service** - Lógica de negócio:
```
apps/api/src/services/<feature-name>.service.ts
```

2. **Route** - Endpoints da API:
```
apps/api/src/routes/<feature-name>.routes.ts
```

3. **Middleware** (se necessário):
```
apps/api/src/middleware/<feature-name>.middleware.ts
```

### Frontend (apps/web)

1. **Page** - Componente de página:
```
apps/web/src/pages/<feature-name>/index.tsx
```

2. **Components** - Componentes específicos:
```
apps/web/src/pages/<feature-name>/components/
```

3. **Hooks** (se necessário):
```
apps/web/src/hooks/use-<feature-name>.ts
```

### Database (libs/db)

1. Adicionar schema em `libs/db/src/schema.ts`
2. Gerar migration: `nx run db:generate`
3. Aplicar migration: `nx run db:migrate`

### Shared Types (libs/shared/types)

1. Adicionar interfaces em `libs/shared/types/src/index.ts`
2. Exportar DTOs para validação

## Convenções

- Nomes de arquivos em kebab-case
- Componentes em PascalCase
- Hooks começam com "use"
- Todas queries filtradas por organizationId
- Validação com Zod no backend
- Timestamps em UTC
