# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copiar código fonte necessário
COPY apps/api ./apps/api
COPY libs ./libs

# Instalar dependências
RUN npm ci

# Build da API
RUN npx nx build api

# Stage 2: Runtime
FROM node:22-alpine AS runner

WORKDIR /app

# Criar usuário não-root para segurança
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 api

# Copiar apenas o bundle buildado
COPY --from=builder /app/dist/apps/api/index.cjs ./index.cjs

# Definir usuário
USER api

# Variáveis de ambiente (serão sobrescritas pelo Coolify)
ENV NODE_ENV=production
ENV SERVER_PORT=3000

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

CMD ["node", "index.cjs"]
