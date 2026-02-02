# Deploy no Coolify - schedulizer.me

## Visão Geral

- **Landing Page**: `schedulizer.me` (nginx + arquivos estáticos)
- **API**: `api.schedulizer.me` (Node.js)
- **App SaaS**: `app.schedulizer.me` (futuro)

## Pré-requisitos

1. Coolify instalado e rodando
2. Domínio `schedulizer.me` apontando para o IP do VPS
3. Repositório GitHub conectado ao Coolify

## Passo 1: Configurar PostgreSQL

1. No Coolify, vá em **Resources** → **+ New** → **Database** → **PostgreSQL**
2. Configure:
   - **Name**: `schedulizer-db`
   - **Database**: `schedulizer`
   - **Username**: `schedulizer`
   - **Password**: (gerar senha segura)
3. Clique em **Deploy**
4. Copie a **Internal URL** (ex: `postgresql://schedulizer:senha@schedulizer-db:5432/schedulizer`)

## Passo 2: Deploy da API (api.schedulizer.me)

1. No Coolify, vá em **Resources** → **+ New** → **Application**
2. Selecione **GitHub** e escolha o repositório
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Docker
   - **Dockerfile Location**: `apps/api/Dockerfile`
   - **Port**: `3000`

4. Em **Domains**, adicione:
   - `api.schedulizer.me`

5. Em **Environment Variables**, adicione:
   ```
   DATABASE_URL=postgresql://schedulizer:SENHA@schedulizer-db:5432/schedulizer
   SERVER_PORT=3000
   BETTER_AUTH_SECRET=gerar-string-segura-32-caracteres-minimo
   BETTER_AUTH_URL=https://api.schedulizer.me
   RESEND_API_KEY=re_seu_api_key
   TURNSTILE_SECRET_KEY=sua_chave_secreta (opcional)
   NODE_ENV=production
   ```

6. Clique em **Deploy**

### Testar API

```bash
curl https://api.schedulizer.me/health
# Resposta esperada: {"status":"ok"}
```

## Passo 3: Deploy da Landing Page (schedulizer.me)

1. No Coolify, vá em **Resources** → **+ New** → **Application**
2. Selecione **GitHub** e escolha o repositório
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Docker
   - **Dockerfile Location**: `apps/landing/Dockerfile`
   - **Port**: `80`

4. Em **Domains**, adicione:
   - `schedulizer.me`
   - `www.schedulizer.me`

5. Em **Build Arguments** (não Environment Variables!):
   ```
   VITE_API_URL=https://api.schedulizer.me
   ```

6. Clique em **Deploy**

## Passo 4: Configurar DNS

No painel do registrador do domínio, adicione:

| Tipo | Nome | Valor | TTL |
|------|------|-------|-----|
| A | @ | IP_DO_VPS | 300 |
| A | www | IP_DO_VPS | 300 |
| A | api | IP_DO_VPS | 300 |
| A | app | IP_DO_VPS | 300 |

## Passo 5: Executar Migrations

Após o deploy da API:

1. No Coolify, acesse o terminal do container da API
2. Ou via SSH no VPS:

```bash
# Encontrar o container da API
docker ps | grep api

# Executar migrations (ajustar conforme necessário)
docker exec -it <container_id> node -e "
  // Migrations serão executadas via Drizzle
"
```

**Alternativa**: Execute as migrations localmente conectando ao banco de produção:

```bash
DATABASE_URL=postgresql://schedulizer:SENHA@VPS_IP:5432/schedulizer npx nx run db:migrate
```

## SSL/HTTPS

O Coolify configura SSL automaticamente via Let's Encrypt. Verifique:
- Em cada aplicação, a opção **HTTPS** deve estar habilitada
- Aguarde alguns minutos após o deploy para o certificado ser emitido

## Troubleshooting

### API não inicia
- Verifique os logs no Coolify
- Confirme que todas as variáveis de ambiente estão configuradas
- Verifique se o PostgreSQL está acessível

### Landing não carrega
- Verifique se o build passou (logs do Coolify)
- Confirme que `VITE_API_URL` está nos **Build Arguments**

### CORS errors
- A API já está configurada para aceitar `schedulizer.me`
- Se adicionar novos domínios, edite `apps/api/src/index.ts`

### Database connection refused
- Verifique se o PostgreSQL está rodando
- Confirme que a URL usa o nome interno do container (não localhost)

## Variáveis de Ambiente - Resumo

### API (Environment Variables)
| Variável | Exemplo | Obrigatório |
|----------|---------|-------------|
| DATABASE_URL | postgresql://... | ✅ |
| SERVER_PORT | 3000 | ✅ |
| BETTER_AUTH_SECRET | string-32-chars | ✅ |
| BETTER_AUTH_URL | https://api.schedulizer.me | ✅ |
| RESEND_API_KEY | re_xxx | ✅ |
| TURNSTILE_SECRET_KEY | xxx | ❌ |
| NODE_ENV | production | ✅ |

### Landing (Build Arguments)
| Variável | Exemplo | Obrigatório |
|----------|---------|-------------|
| VITE_API_URL | https://api.schedulizer.me | ✅ |

## Deploy Contínuo

O Coolify pode configurar webhooks para deploy automático:

1. Em cada aplicação, vá em **Webhooks**
2. Copie a URL do webhook
3. No GitHub, vá em **Settings** → **Webhooks** → **Add webhook**
4. Cole a URL e selecione eventos de push

Assim, cada push para `main` dispara um novo deploy automaticamente.
