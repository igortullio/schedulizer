# Observability Runbook

## Overview

This runbook covers the operational procedures for the Schedulizer observability stack. It documents how to investigate alerts, check dashboards, triage errors, and perform rollback operations.

### Observability Stack

| Component | Purpose | Location |
|-----------|---------|----------|
| Sentry (cloud) | Error tracking, cron monitoring | `https://sentry.io` (Schedulizer org) |
| Uptime Kuma | Uptime monitoring | `https://uptime.schedulizer.me` (self-hosted on Coolify) |
| Slack (`#schedulizer-alerts`) | Alert notifications | Slack workspace |

### Sentry Projects

| Project | App | DSN Source |
|---------|-----|-----------|
| `schedulizer-api` | `apps/api` | `SENTRY_DSN_API` env var |
| `schedulizer-web` | `apps/web` | `VITE_SENTRY_DSN_WEB` env var |
| `schedulizer-landing` | `apps/landing` | `VITE_SENTRY_DSN_LANDING` env var |

## Dashboard Access

### Sentry

1. Go to `https://sentry.io` and log in with the team account
2. Select the **Schedulizer** organization
3. Navigate to the relevant project (api, web, or landing)
4. Key pages:
   - **Issues**: `https://sentry.io/organizations/<org>/issues/`
   - **Crons**: `https://sentry.io/organizations/<org>/crons/`
   - **Alerts**: `https://sentry.io/organizations/<org>/alerts/`

### Uptime Kuma

1. Go to `https://uptime.schedulizer.me` (or the configured Coolify domain)
2. Log in with the admin credentials stored in the team's password manager
3. The main dashboard shows all monitors with current status and uptime percentage

## Alert Investigation

### Sentry Alert (Error Tracking)

When you receive a Slack alert from Sentry:

1. **Click the Sentry link** in the Slack message to open the issue directly
2. **Assess severity**: Check the error level (fatal, error, warning) and the number of affected users
3. **Filter by context**:
   - Use the `organizationId` tag to identify which tenant is affected
   - Use the `userId` tag to identify the specific user
4. **Check breadcrumbs**: Scroll down to the "Breadcrumbs" section to see the sequence of actions that led to the error
5. **Check stack trace**: Verify the stack trace shows readable TypeScript code (not minified). If it shows minified code, see [Source Maps Verification](#source-maps-verification)
6. **Check frequency**: Look at the event timeline to determine if this is a new issue or a recurring one
7. **Take action**:
   - **Critical (payment, auth)**: Fix immediately, deploy hotfix
   - **Non-critical**: Create a GitHub issue, prioritize in the next sprint

### Uptime Kuma Alert (Downtime)

When you receive a Slack alert from Uptime Kuma about downtime:

1. **Check the health endpoint** manually:
   ```bash
   curl -s https://api.schedulizer.me/health | jq .
   ```
2. **Expected healthy response**:
   ```json
   {
     "status": "healthy",
     "timestamp": "2026-02-16T12:00:00.000Z",
     "services": {
       "database": "connected",
       "uptime": "72h 15m"
     }
   }
   ```
3. **If `status: degraded`** (database disconnected):
   - Check PostgreSQL status in Coolify
   - Verify database container is running: check Coolify dashboard > Resources > `schedulizer-db`
   - Check database logs for connection errors
4. **If endpoint is unreachable**:
   - Check Coolify dashboard for API service status
   - Check API container logs in Coolify for startup errors
   - Verify the VPS is accessible (SSH into the server)
   - Check if disk space is full: `df -h`
5. **If the issue is resolved**, Uptime Kuma will send a recovery notification automatically

### Sentry Crons Alert (Missed Schedule)

When Sentry reports a missed or failed `send-reminders` cron:

1. **Check the Crons dashboard**: Navigate to Sentry > Crons > `send-reminders`
2. **If status is `missed`**:
   - The GitHub Actions workflow did not trigger the endpoint on time
   - Check GitHub Actions: Repository > Actions > `send-reminders.yml`
   - Verify the workflow is enabled and not paused
   - Check for GitHub Actions outages at `https://www.githubstatus.com`
3. **If status is `error`**:
   - The endpoint was called but the handler threw an exception
   - Check Sentry issues for the error details
   - Check API logs in Coolify for related error messages
4. **Expected schedule**: `*/15 * * * *` (every 15 minutes) with a 5-minute checkin margin

## Triage Workflow

### Step-by-Step Error Triage

1. **Open the Sentry issue** from the alert notification
2. **Identify the scope**:
   - Single user? Check `userId` tag
   - Single organization? Check `organizationId` tag
   - Global issue? No specific tag filter
3. **Identify the area**:
   - Payment/billing: Check Stripe dashboard for related events
   - Email: Check Resend dashboard for delivery status
   - Booking: Check appointment data in the database
   - Cron: Check Sentry Crons dashboard
4. **Reproduce** (if needed):
   - Use the breadcrumbs to understand the user's actions
   - Use the request data (URL, method, parameters) to reproduce the request
5. **Fix and verify**:
   - Create a fix on a feature branch
   - Deploy to staging and verify the fix using `/api/sentry-debug` or by reproducing the original scenario
   - Deploy to production and monitor Sentry for recurrence

### Alert Fatigue Policy

| Alert Type | Trigger | Notification | Channel |
|-----------|---------|--------------|---------|
| Immediate | Payment/billing failure | Slack (real-time) | `#schedulizer-alerts` |
| Immediate | App downtime (Uptime Kuma) | Slack (real-time) | `#schedulizer-alerts` |
| Immediate | Fatal/unhandled exception (first occurrence) | Slack (real-time) | `#schedulizer-alerts` |
| Immediate | Missed/failed cron job | Slack (real-time) | `#schedulizer-alerts` |
| Daily digest | All non-critical errors | Slack (summary) | `#schedulizer-alerts` |
| Weekly | Sentry weekly report | Email | Team email |

## Source Maps Verification

To verify source maps are correctly uploaded and working:

1. **Trigger a test error** (staging/development only):
   ```bash
   curl https://api.schedulizer.me/api/sentry-debug
   ```
2. **Check the Sentry event**: Open the error in Sentry and verify the stack trace shows:
   - Original TypeScript file names (e.g., `health.routes.ts`, not `chunk-abc123.js`)
   - Correct line numbers matching the source code
   - Readable variable and function names
3. **If stack traces are minified**:
   - Verify `SENTRY_AUTH_TOKEN` is configured as a build argument in Coolify
   - Verify `SENTRY_ORG` and `SENTRY_PROJECT_*` env vars are set correctly
   - Check the build logs in Coolify for source map upload errors
   - Re-deploy to trigger a new source map upload

## Uptime Kuma Monitors

### Configured Monitors

| Monitor | URL | Interval | Retries | Timeout | Check |
|---------|-----|----------|---------|---------|-------|
| API Health | `https://api.schedulizer.me/health` | 60s | 3 | 10s | Keyword: `healthy` |
| Web App | `https://app.schedulizer.me` | 60s | 3 | 10s | Keyword: page title |
| Landing Page | `https://schedulizer.me` | 300s | 3 | 10s | Keyword: page title |

### Checking Monitor Status

1. Open the Uptime Kuma dashboard
2. Each monitor shows: current status (Up/Down), uptime percentage (7 days), average response time
3. Click a monitor for detailed history including response time graphs and incident timeline

## Rollback Procedures

### Rollback Sentry (Error Tracking)

**Disable error tracking without code changes:**

1. In Coolify, remove the Sentry DSN environment variables from the services:
   - API: Remove `SENTRY_DSN_API`
   - Web: Remove `VITE_SENTRY_DSN_WEB`
   - Landing: Remove `VITE_SENTRY_DSN_LANDING`
2. Re-deploy all three services
3. The Sentry SDK will not initialize without a DSN — the app continues working normally without error tracking

**Disable backend Sentry instrumentation:**

1. In the API Dockerfile or entrypoint script, remove the `--require ./instrument.cjs` flag from the Node.js command
2. Re-deploy the API service
3. The API starts without Sentry instrumentation

### Rollback Source Maps Upload

1. In Coolify, remove `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT_*` build arguments from web and landing services
2. Re-deploy — the build continues normally without uploading source maps
3. Stack traces in Sentry will show minified code but the app is unaffected

### Rollback Uptime Kuma

1. In Coolify, stop the Uptime Kuma service
2. No impact on application functionality — Uptime Kuma is passive monitoring only
3. To fully remove: delete the Uptime Kuma service in Coolify

### Full Observability Rollback

To revert to the pre-observability state:

1. Remove Sentry DSN environment variables from all services in Coolify:
   - API: Remove `SENTRY_DSN_API`
   - Web: Remove `VITE_SENTRY_DSN_WEB`
   - Landing: Remove `VITE_SENTRY_DSN_LANDING`
2. Remove `--require ./instrument.cjs` from the API entrypoint
3. Remove `SENTRY_AUTH_TOKEN`, `SENTRY_ORG`, and `SENTRY_PROJECT_*` build arguments
4. Stop the Uptime Kuma service in Coolify
5. Re-deploy all services

**Data consistency**: No database migrations are involved. All observability data is stored externally (Sentry cloud, Uptime Kuma SQLite). Rollback causes no data inconsistency.

## Meta-Monitoring

### Verifying the Observability Stack

Periodically verify that the observability components are working:

1. **Sentry**: Navigate to Sentry > Settings > Usage to check quota (free tier: 5k errors/month). If approaching the limit, review `beforeSend` filters
2. **Uptime Kuma**: Check that the Uptime Kuma dashboard is accessible. If not, check the service in Coolify
3. **Slack integration**: Send a test alert from both Sentry (create test issue) and Uptime Kuma (pause/unpause a monitor) to verify Slack delivery
4. **Sentry Crons**: Check that the `send-reminders` monitor shows recent successful check-ins on the expected schedule

### Sentry Quota Management

The Sentry free tier allows 5,000 errors per month. To manage quota:

- Monitor usage at: Sentry > Settings > Subscription > Usage
- The SDK includes a `beforeSend` filter that drops low-value errors (network errors, 404s in non-API routes)
- If quota is exceeded, Sentry silently drops events — the app is unaffected
- Consider upgrading to a paid plan if consistently hitting the limit

## Environment Variables Reference

| Variable | Apps | Type | Description |
|----------|------|------|-------------|
| `SENTRY_DSN_API` | api | Runtime | Sentry project DSN for API event ingestion |
| `VITE_SENTRY_DSN_WEB` | web | Runtime | Sentry project DSN for web app event ingestion |
| `VITE_SENTRY_DSN_LANDING` | landing | Runtime | Sentry project DSN for landing page event ingestion |
| `SENTRY_ENVIRONMENT` | api, web, landing | Runtime | Environment identifier (`production`, `staging`, `development`) |
| `SENTRY_AUTH_TOKEN` | web, landing | Build-time only | Token for source map upload (do NOT expose at runtime) |
| `SENTRY_ORG` | web, landing | Build-time only | Sentry organization slug |
| `SENTRY_PROJECT_API` | api | Build-time only | Sentry project name for API |
| `SENTRY_PROJECT_WEB` | web | Build-time only | Sentry project name for Web |
| `SENTRY_PROJECT_LANDING` | landing | Build-time only | Sentry project name for Landing |
| `SLACK_WEBHOOK_URL` | Uptime Kuma | Runtime | Slack Incoming Webhook URL for alerts |

## Related Documentation

- [Deployment Guide](../DEPLOY.md) — Coolify deployment steps and observability environment setup
- [Architecture Overview](../ARCHITECTURE-OVERVIEW.md) — System architecture including observability components
- [CI/CD Pipeline](../CI_CD.md) — Workflow configuration and Sentry-related secrets
