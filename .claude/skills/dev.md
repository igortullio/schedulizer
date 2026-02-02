# Development Environment Skill

Inicia o ambiente de desenvolvimento completo.

## Comandos

1. Subir o banco de dados:
```bash
docker-compose up -d
```

2. Iniciar frontend e backend simultaneamente:
```bash
nx run-many -t serve
```

3. Ou iniciar separadamente:
```bash
# Frontend (porta 4200)
nx serve web

# Backend (porta 3000)
nx serve api
```

## URLs

- Frontend: http://localhost:4200
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 18+ instalado
- Arquivo .env configurado (copiar de .env.example)
