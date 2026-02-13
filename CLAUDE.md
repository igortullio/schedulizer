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
- @.claude/rules/commit.md - Commit standards and validations

## Skills

Use these skills for common tasks:

- `/dev` - Start the development environment
- `/check` - Run lint and formatting checks
- `/db-migrate` - Generate and apply database migrations
- `/nx` - General guidelines for working with Nx

## Dependencies

- NEVER add `@rollup/rollup-*` packages as explicit dependencies. They are optional platform-specific packages resolved automatically by npm. If `npm install` fails with a rollup error, the fix is `rm -rf node_modules package-lock.json && npm install --include=dev`
- Root `package.json` should only have devDependencies (tooling shared across the monorepo). App-specific dependencies go in their respective workspace `package.json`
- Use `npm install --include=dev` instead of plain `npm install` (npm 11 with workspaces skips root devDependencies by default)

## MCPs

- Prioritize the Context7 MCP for documentation, APIs, SDKs, and up-to-date technical references
- Context7 overrides internal knowledge in case of conflict
