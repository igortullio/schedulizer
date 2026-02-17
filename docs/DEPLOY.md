# Deploy on Coolify - schedulizer.me

## Overview

- **Landing Page**: `schedulizer.me` (nginx + static files)
- **API**: `api.schedulizer.me` (Node.js)
- **SaaS App**: `app.schedulizer.me` (future)
- **Uptime Kuma**: `uptime.schedulizer.me` (uptime monitoring)

## Prerequisites

1. Coolify installed and running
2. Domain `schedulizer.me` pointing to the VPS IP
3. GitHub repository connected to Coolify

## Step 1: Configure PostgreSQL

1. In Coolify, go to **Resources** → **+ New** → **Database** → **PostgreSQL**
2. Configure:
   - **Name**: `schedulizer-db`
   - **Database**: `schedulizer`
   - **Username**: `schedulizer`
   - **Password**: (generate secure password)
3. Click **Deploy**
4. Copy the **Internal URL** (e.g., `postgresql://schedulizer:password@schedulizer-db:5432/schedulizer`)

## Step 2: Deploy API (api.schedulizer.me)

1. In Coolify, go to **Resources** → **+ New** → **Application**
2. Select **GitHub** and choose the repository
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Docker
   - **Dockerfile Location**: `apps/api/Dockerfile`
   - **Port**: `3000`

4. In **Domains**, add:
   - `api.schedulizer.me`

5. In **Environment Variables**, add:
   ```
   DATABASE_URL=postgresql://schedulizer:PASSWORD@schedulizer-db:5432/schedulizer
   SERVER_PORT=3000
   BETTER_AUTH_SECRET=generate-secure-string-32-characters-minimum
   BETTER_AUTH_URL=https://api.schedulizer.me
   RESEND_API_KEY=re_your_api_key
   TURNSTILE_SECRET_KEY=your_secret_key (optional)
   NODE_ENV=production
   SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   SENTRY_ENVIRONMENT=production
   ```

6. Click **Deploy**

### Test API

```bash
curl https://api.schedulizer.me/health
# Expected response: {"status":"healthy","timestamp":"...","services":{"database":"connected","uptime":"..."}}
```

## Step 3: Deploy Landing Page (schedulizer.me)

1. In Coolify, go to **Resources** → **+ New** → **Application**
2. Select **GitHub** and choose the repository
3. Configure:
   - **Branch**: `main`
   - **Build Pack**: Docker
   - **Dockerfile Location**: `apps/landing/Dockerfile`
   - **Port**: `80`

4. In **Domains**, add:
   - `schedulizer.me`
   - `www.schedulizer.me`

5. In **Build Arguments** (not Environment Variables!):
   ```
   VITE_API_URL=https://api.schedulizer.me
   VITE_SENTRY_DSN=https://xxx@xxx.ingest.sentry.io/xxx
   VITE_SENTRY_ENVIRONMENT=production
   SENTRY_AUTH_TOKEN=sntrys_xxx
   SENTRY_ORG=your-sentry-org
   SENTRY_PROJECT=schedulizer-landing
   ```

6. Click **Deploy**

## Step 4: Deploy Uptime Kuma (uptime.schedulizer.me)

1. In Coolify, go to **Resources** → **+ New** → **Service** → Search for **Uptime Kuma**
2. Configure:
   - **Name**: `schedulizer-uptime`
   - **Port**: `3001` (default)
3. In **Domains**, add:
   - `uptime.schedulizer.me`
4. Click **Deploy**
5. Access the Uptime Kuma dashboard at `https://uptime.schedulizer.me` and complete initial setup (create admin account)
6. Add monitors:

| Monitor | Type | URL | Interval | Retries | Timeout | Keyword |
|---------|------|-----|----------|---------|---------|---------|
| API Health | HTTP(s) - Keyword | `https://api.schedulizer.me/health` | 60s | 3 | 10s | `healthy` |
| Web App | HTTP(s) - Keyword | `https://app.schedulizer.me` | 60s | 3 | 10s | `Schedulizer` |
| Landing Page | HTTP(s) - Keyword | `https://schedulizer.me` | 300s | 3 | 10s | `Schedulizer` |

7. Configure Slack notification:
   - Go to **Settings** → **Notifications** → **Setup Notification**
   - Select **Slack Incoming Webhook** and paste the `SLACK_WEBHOOK_URL`
   - Enable for all monitors
   - Test the notification to verify delivery

## Step 5: Configure DNS

In the domain registrar panel, add:

| Type | Name | Value | TTL |
|------|------|-------|-----|
| A | @ | VPS_IP | 300 |
| A | www | VPS_IP | 300 |
| A | api | VPS_IP | 300 |
| A | app | VPS_IP | 300 |
| A | uptime | VPS_IP | 300 |

## Step 6: Run Migrations

After API deployment:

1. In Coolify, access the API container terminal
2. Or via SSH on VPS:

```bash
# Find the API container
docker ps | grep api

# Run migrations (adjust as needed)
docker exec -it <container_id> node -e "
  // Migrations will be executed via Drizzle
"
```

**Alternative**: Run migrations locally connecting to the production database:

```bash
DATABASE_URL=postgresql://schedulizer:PASSWORD@VPS_IP:5432/schedulizer npx nx run db:migrate
```

## SSL/HTTPS

Coolify configures SSL automatically via Let's Encrypt. Verify:
- In each application, the **HTTPS** option should be enabled
- Wait a few minutes after deployment for the certificate to be issued

## Troubleshooting

### API won't start
- Check the logs in Coolify
- Confirm all environment variables are configured
- Verify PostgreSQL is accessible

### Landing page won't load
- Check if the build passed (Coolify logs)
- Confirm `VITE_API_URL` is in **Build Arguments**

### CORS errors
- The API is already configured to accept `schedulizer.me`
- If adding new domains, edit `apps/api/src/index.ts`

### Database connection refused
- Verify PostgreSQL is running
- Confirm the URL uses the internal container name (not localhost)

## Environment Variables - Summary

### API (Environment Variables)
| Variable | Example | Required |
|----------|---------|----------|
| DATABASE_URL | postgresql://... | ✅ |
| SERVER_PORT | 3000 | ✅ |
| BETTER_AUTH_SECRET | string-32-chars | ✅ |
| BETTER_AUTH_URL | https://api.schedulizer.me | ✅ |
| RESEND_API_KEY | re_xxx | ✅ |
| TURNSTILE_SECRET_KEY | xxx | ❌ |
| NODE_ENV | production | ✅ |
| SENTRY_DSN | https://xxx@xxx.ingest.sentry.io/xxx | ❌ |
| SENTRY_ENVIRONMENT | production | ❌ |

### Web (Environment Variables + Build Arguments)
| Variable | Type | Example | Required |
|----------|------|---------|----------|
| VITE_API_URL | Build Arg | https://api.schedulizer.me | ✅ |
| VITE_SENTRY_DSN | Build Arg | https://xxx@xxx.ingest.sentry.io/xxx | ❌ |
| VITE_SENTRY_ENVIRONMENT | Build Arg | production | ❌ |
| SENTRY_AUTH_TOKEN | Build Arg | sntrys_xxx | ❌ |
| SENTRY_ORG | Build Arg | your-sentry-org | ❌ |
| SENTRY_PROJECT | Build Arg | schedulizer-web | ❌ |

### Landing (Build Arguments)
| Variable | Example | Required |
|----------|---------|----------|
| VITE_API_URL | https://api.schedulizer.me | ✅ |
| VITE_SENTRY_DSN | https://xxx@xxx.ingest.sentry.io/xxx | ❌ |
| VITE_SENTRY_ENVIRONMENT | production | ❌ |
| SENTRY_AUTH_TOKEN | sntrys_xxx | ❌ |
| SENTRY_ORG | your-sentry-org | ❌ |
| SENTRY_PROJECT | schedulizer-landing | ❌ |

> **Security note**: `SENTRY_AUTH_TOKEN` must be configured as a **Build Argument** only, not as a runtime Environment Variable. It is used exclusively during the build process for source map uploads.

## Continuous Deployment

Coolify can configure webhooks for automatic deployment:

1. In each application, go to **Webhooks**
2. Copy the webhook URL
3. On GitHub, go to **Settings** → **Webhooks** → **Add webhook**
4. Paste the URL and select push events

This way, each push to `main` triggers a new deployment automatically.
