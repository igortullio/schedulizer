# CI/CD Pipeline - Schedulizer

## Overview

Schedulizer uses GitHub Actions to automate continuous integration (CI) and continuous deployment (CD) processes. This document describes the complete pipeline configuration, including required secrets, environment variables, and setup instructions.

## Difference Between CI and CD

### CI - Continuous Integration (`ci.yml`)
- **When it runs**: On all Pull Requests to any branch
- **Purpose**: Validate code before merge (lint, test, build)
- **Optimization**: Uses `nx affected` to process only changed projects
- **Required secrets**: None (uses only code)

### CD - Continuous Deployment (`cd.yml`)
- **When it runs**: Only on `main` branch after merge
- **Purpose**: Production build and artifact generation for deploy
- **Scope**: Builds all apps with `nx run-many -t build --all`
- **Required secrets**: `VITE_API_URL` (required for frontend build)

## Secrets and Environment Variables

### GitHub Actions Secrets

The following secrets must be configured in the GitHub repository for workflows to function correctly:

#### Required Secrets

| Secret | Used in | Purpose | Example |
|--------|---------|---------|---------|
| `VITE_API_URL` | CD (main branch) | API URL for frontend in production. Injects the API URL into the Vite build so the React app knows where to make HTTP requests. | `https://api.schedulizer.com` |

#### Optional Secrets

| Secret | Used in | Purpose | Example |
|--------|---------|---------|---------|
| `VITE_TURNSTILE_SITE_KEY` | CD (main branch) | Cloudflare Turnstile site key for captcha. If not configured, the system works without captcha. | `0x4AAAAAAxxxx` |
| `VITE_SENTRY_DSN` | CD (main branch) | Sentry DSN for frontend error tracking. If not configured, Sentry is disabled. | `https://xxx@xxx.ingest.sentry.io/xxx` |
| `VITE_SENTRY_ENVIRONMENT` | CD (main branch) | Sentry environment identifier for frontend. | `production` |
| `SENTRY_AUTH_TOKEN` | CD (main branch) | Sentry auth token for source map uploads during build. | `sntrys_xxx` |
| `SENTRY_ORG` | CD (main branch) | Sentry organization slug for source map uploads. | `your-sentry-org` |
| `SENTRY_PROJECT_WEB` | CD (main branch) | Sentry project name for the web app. | `schedulizer-web` |
| `SENTRY_PROJECT_LANDING` | CD (main branch) | Sentry project name for the landing page. | `schedulizer-landing` |

### Project Environment Variables

Project environment variables are validated using Zod schemas. Below is the complete list based on `.env.example` and validation schemas:

#### Client Variables (Frontend)
Defined in `/libs/shared/env/src/client.ts`. **All must have `VITE_` prefix** to be exposed to the browser.

| Variable | Required | Purpose | Validation |
|----------|----------|---------|------------|
| `VITE_API_URL` | ✅ Yes | Backend API base URL | Must be a valid URL |
| `VITE_TURNSTILE_SITE_KEY` | ❌ No | Cloudflare Turnstile public key for captcha | Optional string |
| `VITE_SENTRY_DSN` | ❌ No | Sentry DSN for frontend error tracking | Optional string |
| `VITE_SENTRY_ENVIRONMENT` | ❌ No | Sentry environment identifier | Optional string |

#### Server Variables (Backend)
Defined in `/libs/shared/env/src/server.ts`. **Must not have `VITE_` prefix**.

| Variable | Required | Purpose | Validation |
|----------|----------|---------|------------|
| `DATABASE_URL` | ✅ Yes | PostgreSQL connection string | Required string |
| `SERVER_PORT` | ❌ No | Express server port | Number (default: 3000) |
| `BETTER_AUTH_SECRET` | ✅ Yes | Secret for token signing | Minimum 32 characters |
| `BETTER_AUTH_URL` | ✅ Yes | Application base URL for auth | Required string |
| `RESEND_API_KEY` | ✅ Yes | Resend API key for sending emails | Required string |
| `TURNSTILE_SECRET_KEY` | ❌ No | Cloudflare Turnstile secret key for captcha | Optional string |
| `SENTRY_DSN` | ❌ No | Sentry DSN for backend error tracking | Optional string |
| `SENTRY_ENVIRONMENT` | ❌ No | Sentry environment identifier (production, staging) | Optional string |

## Step-by-Step Configuration

### 1. Configure Secrets on GitHub

1. Access your repository on GitHub
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. For each required secret:
   - **Name**: Exact secret name (e.g., `VITE_API_URL`)
   - **Secret**: Secret value (e.g., `https://api.schedulizer.com`)
   - Click **Add secret**

### 2. Configure Local Environment

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Fill in all required variables in the `.env` file:
   ```bash
   # Database
   DATABASE_URL="postgresql://user:password@localhost:5432/schedulizer"

   # Server
   SERVER_PORT=3000

   # Authentication
   BETTER_AUTH_SECRET="your-32-character-minimum-secret-here"
   BETTER_AUTH_URL="http://localhost:5173"

   # Email
   RESEND_API_KEY="re_xxxxxxxxxxxxx"

   # Captcha (optional)
   TURNSTILE_SECRET_KEY="0x4AAAA..."

   # Frontend
   VITE_API_URL="http://localhost:3000"
   VITE_TURNSTILE_SITE_KEY="0x4AAAA..."
   ```

3. **Important**: Never commit the `.env` file (already in `.gitignore`)

### 3. Configure Branch Protection Rules

The `main` branch protection rules ensure that only validated code is merged.

1. Access **Settings** → **Branches** → **Branch protection rules**
2. Click **Add rule**
3. Configure:
   - **Branch name pattern**: `main`
   - ✅ **Require status checks to pass before merging**
     - **Status checks that are required**:
       - `lint` (code validation with Biome)
       - `test` (unit tests)
       - `build` (build validation)
   - ✅ **Require branches to be up to date before merging**
   - ✅ **Do not allow bypassing the above settings** (forces admins to follow rules)
   - ✅ **Restrict who can dismiss pull request reviews** (extra protection)
   - ❌ **Allow force pushes** (disabled for security)
   - ❌ **Allow deletions** (disabled for security)
4. Click **Create**

Full reference: [.github/BRANCH_PROTECTION.md](.github/BRANCH_PROTECTION.md)

## Workflow Structure

### CI Workflow (`.github/workflows/ci.yml`)

```yaml
name: CI
on:
  pull_request:
    branches: ['**']

jobs:
  lint:
    # Validates code with Biome (format, linting, import organization)
  test:
    # Runs unit tests with Vitest
  build:
    # Validates build of all affected projects
```

**Characteristics**:
- Runs in parallel (lint, test, build simultaneously)
- Uses `nx affected` to process only changed code
- Requires `fetch-depth: 0` and `nrwl/nx-set-shas@v4` for change detection
- `node_modules` cache for faster builds
- No secrets required (no production build)

### CD Workflow (`.github/workflows/cd.yml`)

```yaml
name: CD
on:
  push:
    branches: [main]

jobs:
  build:
    # Production build of all apps
    # Artifact upload (retention: 90 days)
```

**Characteristics**:
- Runs only on `main` branch
- Builds **all** projects (doesn't use `affected`)
- Injects `VITE_API_URL` into frontend build
- Generates artifacts:
  - `dist-web`: Built React frontend
  - `dist-api`: Built Express backend
- Artifacts retained for 90 days

## Troubleshooting Guide

### 1. Error: "VITE_API_URL is not defined"

**Symptom**: CD build fails with error about undefined environment variable.

**Cause**: `VITE_API_URL` secret not configured on GitHub.

**Solution**:
1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Add secret `VITE_API_URL` with the production API URL
3. Re-run the workflow

### 2. Error: "BETTER_AUTH_SECRET must be at least 32 characters"

**Symptom**: Environment validation fails on server.

**Cause**: `BETTER_AUTH_SECRET` secret too short (security requirement).

**Solution**:
```bash
# Generate a secure secret with 32+ characters
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```
Copy the result to your `.env` or GitHub secret.

### 3. Build Fails: "Some affected projects failed"

**Symptom**: CI fails at build step with TypeScript compilation error.

**Cause**: Type errors not detected locally or incorrect `tsconfig.json` configuration.

**Solution**:
1. Run locally: `npx nx affected -t build`
2. Check TypeScript errors
3. If needed, clear cache: `npx nx reset`
4. Rebuild: `npx nx affected -t build --skip-nx-cache`

### 4. Tests Failing: "Cannot find module"

**Symptom**: CI fails at test step with module not found error.

**Cause**: Dependency not installed or corrupted cache.

**Solution**:
1. Verify `package.json` is correct
2. Run locally: `npm ci && npx nx affected -t test`
3. If it works locally, the problem may be GitHub Actions cache
4. Force reinstall in CI: add `- run: npm ci --force` in workflow

### 5. Affected Detection Not Working

**Symptom**: `nx affected` doesn't detect changed projects or detects all projects.

**Cause**: Incomplete Git history or `nrwl/nx-set-shas` not configured.

**Solution**:
- Verify workflow has `fetch-depth: 0` in `actions/checkout`
- Verify `nrwl/nx-set-shas@v4` is present before using `affected`
- Run locally: `npx nx affected:apps` for debugging

### 6. Cache Issues: Slow Build

**Symptom**: CI builds taking too long despite configured cache.

**Cause**: npm or Nx cache not working correctly.

**Solution**:
- Verify `actions/cache@v4` is configured with correct path: `~/.npm`
- Nx cache is managed automatically, but can be reset: `npx nx reset`
- If problem persists, investigate if `package-lock.json` is being committed

### 7. Artifact Upload Fails

**Symptom**: CD completes build but fails to upload artifacts.

**Cause**: Incorrect artifact path or insufficient permissions.

**Solution**:
- Verify path in workflow points to `./dist/apps/web` and `./dist/apps/api`
- Ensure build generated the files: add `- run: ls -la dist/apps/` before upload
- Check workflow permissions: may need `permissions: contents: read`

## Maintenance

### Adding New Secrets

1. Add the variable in `/libs/shared/env/src/client.ts` (frontend) or `/libs/shared/env/src/server.ts` (backend)
2. Add appropriate Zod validation
3. Add to `.env.example` with example value
4. If needed in CI/CD, add to workflow with `secrets.SECRET_NAME`
5. Update this documentation in the "Secrets and Environment Variables" section

### Updating Workflows

1. Modify `.github/workflows/*.yml` files
2. Validate syntax: `npx yaml-lint .github/workflows/`
3. Run validation tests: `npm run test:workflows`
4. Test locally with [act](https://github.com/nektos/act) if possible
5. Commit and observe execution on GitHub Actions

### Monitoring

- Access **Actions** tab on GitHub to view execution history
- Configure notifications in **Settings** → **Notifications** → **GitHub Actions**
- Monitor build time and consider optimizations if it exceeds 10 minutes

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx CI Documentation](https://nx.dev/ci/intro/ci-with-nx)
- [Branch Protection Rules](.github/BRANCH_PROTECTION.md)
- [CD Validation Checklist](.github/workflows/tests/CD_VALIDATION_CHECKLIST.md)
- [Project Conventions](../CLAUDE.md)

## Contact and Support

For questions about the CI/CD pipeline:
1. Consult this document first
2. Check the [troubleshooting](#troubleshooting-guide)
3. Open an issue in the repository with label `ci/cd`
