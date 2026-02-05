# Development Environment Skill

Starts the full development environment

## Prerequisites

- Docker and Docker Compose installed
- Node.js 18+ installed
- .env file configured (copy from .env.example)

## Commands

- Start the database:
```bash
docker-compose up -d
```

- Start frontend and backend simultaneously:
```bash
nx run-many -t serve
```

- Start only frontend:
```bash
# Frontend (port 4200)
nx serve web
```

- Start only backend:
# Backend (port 3000)
```bash
nx serve api
```

## URLs

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
    - Health Check: http://localhost:3000/health
