# Schedulizer

Modern SaaS scheduling software for small businesses

## Architecture

- Monorepo: Nx (@nx.json)
    - Frontend (React + Vite + Tailwind + Shadcn):
        - Web (`apps/web`)
        - Landing page (`apps/landing`)
    - Backend (Express.js v5 + TypeScript) (`apps/api`)
    - Database (PostgreSQL + Drizzle ORM) (`libs/db`)
    - Shared libs:
        - Env validation (`libs/shared/env`)
        - TypeScript types (`libs/shared/types`)

## Rules

Use these rules for standars:

- @.claude/rules/code-standards.md - Code standards
- @.claude/rules/http.md - Creates a new backend route following the standard structure
- @.claude/rules/logging.md - Logging best practices

## Skills

Use these skills for common tasks:

- `/dev` - Start the development environment
- `/check` - Run lint and formatting checks
- `/db-migrate` - Generate and apply database migrations

## MCPs

- Prioritize the Context7 MCP for documentation, APIs, SDKs, and up-to-date technical references
- Context7 overrides internal knowledge in case of conflict
