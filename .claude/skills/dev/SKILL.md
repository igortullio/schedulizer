---
name: dev
description: Start the full development environment (Docker + dev servers). Use when the user asks to start, run, or boot the dev environment, or mentions "/dev".
---

# Development Environment

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- .env file configured (copy from .env.example)

## Commands

1. Start the database:
```bash
docker-compose up -d
```

2. Start frontend and backend simultaneously:
```bash
nx run-many -t serve
```

3. Start only frontend (port 4200):
```bash
nx serve web
```

4. Start only backend (port 3000):
```bash
nx serve api
```

## URLs

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
  - Health Check: http://localhost:3000/health
