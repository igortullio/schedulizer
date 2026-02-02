# Schedulizer

> Modern scheduling software for small businesses — simple, secure, and open source

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D20.0.0-brightgreen)](https://nodejs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue)](https://www.typescriptlang.org/)

## About

Schedulizer is a **scheduling software** and **appointment management** system designed for small businesses. Built as an **open source SaaS booking system**, it helps businesses manage appointments, bookings, and schedules with a modern, user-friendly interface.

Whether you're running a salon, a consultancy, a clinic, or any service-based business, Schedulizer provides the **appointment scheduling** tools you need to organize your time, reduce no-shows, and deliver a better experience to your customers.

This **booking system** combines powerful **scheduling software** capabilities with enterprise-grade features like multi-tenancy, secure authentication, and real-time **appointment management** — all while remaining accessible and easy to self-host. Perfect for businesses seeking a reliable **open source scheduling solution**.

## Features

- ✨ **Magic Link Authentication** — Secure, passwordless login via email for your booking system
- 🏢 **Multi-Tenant Architecture** — Manage multiple organizations from a single scheduling software instance
- 📅 **Appointment Management** — Create, update, and track appointments effortlessly with intuitive scheduling tools
- 📆 **Booking System** — Streamlined appointment booking for clients and customers
- 🔒 **Security First** — Built-in CAPTCHA protection and secure session management for SaaS applications
- 🎨 **Modern UI** — Built with React 19, Tailwind CSS v4, and Shadcn/ui components
- 🗄️ **Type-Safe Database** — Drizzle ORM with PostgreSQL for reliable appointment data management
- 📧 **Email Notifications** — Automated booking confirmations powered by Resend
- ⚡ **Fast Development** — Hot module replacement with Vite, organized in an Nx monorepo

## Tech Stack

**Frontend:**
- React 19 with TypeScript
- Vite for fast development and builds
- Tailwind CSS v4 for styling
- Shadcn/ui component library

**Backend:**
- Express.js v5 with TypeScript
- better-auth for authentication
- Zod for validation

**Database:**
- PostgreSQL 16
- Drizzle ORM for type-safe queries

**Infrastructure:**
- Nx monorepo for workspace management
- Docker Compose for local development
- Biome for linting and formatting

## Getting Started

### Prerequisites

- **Node.js** 20.0.0 or higher
- **npm** or **yarn**
- **Docker** (for running PostgreSQL locally)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd schedulizer
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration (database credentials, API keys, etc.)

4. Start the PostgreSQL database:
```bash
docker-compose up -d
```

5. Run database migrations:
```bash
npx nx run db:migrate
```

### Running Locally

**Start the frontend:**
```bash
npx nx serve web
```
The web app will be available at `http://localhost:4200`

**Start the backend:**
```bash
npx nx serve api
```
The API will be available at `http://localhost:3000`

**Run both simultaneously:**
```bash
npx nx run-many -t serve
```

## Project Structure

Schedulizer is organized as an **Nx monorepo** with a clear separation of concerns:

```
schedulizer/
├── apps/
│   ├── web/              # React frontend application
│   └── api/              # Express.js backend API
├── libs/
│   ├── db/               # Drizzle ORM schemas and database logic
│   ├── shared/
│   │   ├── types/        # Shared TypeScript types
│   │   └── env/          # Environment variable validation (Zod)
├── nx.json               # Nx workspace configuration
├── package.json          # Root package and scripts
└── docker-compose.yml    # PostgreSQL development setup
```

## Development

### Common Commands

**Linting and Formatting:**
```bash
npm run check          # Check code quality
npm run format         # Auto-fix formatting issues
npm run lint          # Run linter only
```

**Database Operations:**
```bash
npx nx run db:generate  # Generate new migrations
npx nx run db:migrate   # Apply migrations
npx nx run db:studio    # Open Drizzle Studio (database GUI)
```

**Monorepo Utilities:**
```bash
npx nx graph            # Visualize project dependencies
npx nx affected:test    # Run tests for affected projects
```

## License

This project is licensed under the **MIT License** — see the [LICENSE](./LICENSE) file for details.
