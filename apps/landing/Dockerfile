# Stage 1: Build
FROM node:22-alpine AS builder

WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json ./
COPY nx.json tsconfig.base.json ./

# Copiar código fonte necessário
COPY apps/landing ./apps/landing
COPY libs ./libs

# Instalar dependências
RUN npm install --include=dev

# Build da landing page
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL

RUN npx nx build landing

# Stage 2: Serve com nginx
FROM nginx:alpine

# Copiar configuração customizada do nginx
COPY apps/landing/nginx.conf /etc/nginx/conf.d/default.conf

# Copiar arquivos buildados
COPY --from=builder /app/dist/apps/landing /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
