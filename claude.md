# Schedulizer

Sistema SaaS de gerenciamento de agendamentos.

## Arquitetura

- **Monorepo**: Nx
- **Frontend**: React + Vite + Tailwind + Shadcn (apps/web)
- **Backend**: Express.js v5 + TypeScript (apps/api)
- **Database**: PostgreSQL + Drizzle ORM (libs/db)
- **Auth**: better-auth (magic link + organization + captcha)
- **Email**: Resend

## Comandos

- `nx serve web` - Frontend dev
- `nx serve api` - Backend dev
- `nx run-many -t serve` - Ambos
- `nx run db:generate` - Gerar migrations
- `nx run db:migrate` - Aplicar migrations
- `nx run db:studio` - Drizzle Studio
- `npx biome check .` - Lint + format check
- `npx biome check . --write` - Auto-fix

## Convenções

- Timestamps em UTC no banco, convertidos no frontend
- Todas queries filtradas por organization_id (multi-tenancy)
- Autenticação apenas via magic link
- Validação com Zod

## Estrutura de Pastas

- `apps/web/src/components/` - Componentes React
- `apps/web/src/pages/` - Páginas/rotas
- `apps/api/src/routes/` - Rotas Express
- `apps/api/src/services/` - Lógica de negócio
- `apps/api/src/lib/auth.ts` - Configuração better-auth
- `libs/db/src/schema.ts` - Schemas Drizzle
- `libs/shared/env/` - Validação de variáveis de ambiente
- `libs/shared/types/` - Tipos TypeScript compartilhados

## Variáveis de Ambiente

- Backend usa `@schedulizer/env/server` (serverEnv)
- Frontend usa `@schedulizer/env/client` (clientEnv)
- Variáveis do frontend devem ter prefixo `VITE_`

## CI/CD

- **CI (Pull Requests)**: Valida lint, test e build em código alterado (nx affected)
- **CD (Main Branch)**: Build de produção de todos os apps + upload de artefatos
- **Secrets necessários**: `VITE_API_URL` (obrigatório para build de produção)
- **Branch Protection**: CI checks obrigatórios antes de merge (lint, test, build)
- Documentação completa: [.github/CI_CD.md](.github/CI_CD.md)
