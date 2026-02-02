# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- **CI/CD Pipeline**:
  - GitHub Actions workflow for CI (lint, test, build on pull requests)
  - GitHub Actions workflow for CD (deploy artifacts on main branch)
  - Branch protection rules for main branch requiring all CI checks to pass
- **Monorepo Structure**: Nx workspace with apps/ and libs/ organization
- **Frontend (apps/web)**: React 19 + Vite + Tailwind CSS v4 + Shadcn/ui
- **Backend (apps/api)**: Express.js v5 + TypeScript with better-auth integration
- **Database (libs/db)**: Drizzle ORM with PostgreSQL schemas for:
  - User authentication (users, sessions, accounts, verifications)
  - Multi-tenancy (organizations, members, invitations)
  - Core business (services, schedules, appointments)
- **Shared Libraries**:
  - `@schedulizer/shared-types`: TypeScript interfaces and DTOs
  - `@schedulizer/env`: Zod-based environment validation (server/client)
- **Infrastructure**:
  - Docker Compose for PostgreSQL 16
  - Environment configuration template (.env.example)
- **Developer Experience**:
  - Biome for linting and formatting
  - Claude Code skills for common workflows
  - Project documentation (claude.md)

### Changed

- Replaced Prettier with Biome for faster linting and formatting
