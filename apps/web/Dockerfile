# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copiar código fonte necessário
COPY apps/web ./apps/web
COPY libs ./libs

# Instalar dependências
RUN npm ci

# Build da aplicação web
ARG VITE_API_URL
ARG VITE_WEB_URL
ARG VITE_TURNSTILE_SITE_KEY
ARG VITE_STRIPE_PUBLISHABLE_KEY

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WEB_URL=$VITE_WEB_URL
ENV VITE_TURNSTILE_SITE_KEY=$VITE_TURNSTILE_SITE_KEY
ENV VITE_STRIPE_PUBLISHABLE_KEY=$VITE_STRIPE_PUBLISHABLE_KEY

RUN npx nx build web

# Stage 2: Serve com nginx
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist/apps/web /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
