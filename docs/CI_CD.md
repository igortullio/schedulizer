# CI/CD Pipeline - Schedulizer

## Overview

Schedulizer uses GitHub Actions to automate continuous integration, continuous deployment, and release management. All workflows use **Node 22** and **`npm install --include=dev`** (not `npm ci`) to avoid cross-platform lockfile issues.

## Workflows

### CI (`.github/workflows/ci.yml`)

| | |
|---|---|
| **Trigger** | `pull_request` to `main` |
| **Purpose** | Validate code before merge |
| **Secrets** | None |

Jobs (run in parallel):

| Job | Command |
|-----|---------|
| `lint` | `npx nx affected -t lint` |
| `typecheck` | `npx nx affected -t typecheck` |
| `test` | `npx nx affected -t test` |
| `docker-build` | Builds api, web, and landing Dockerfiles (push: false) |

Uses `nx affected` with `nrwl/nx-set-shas@v4` to process only changed projects. Requires `fetch-depth: 0` for change detection.

### CD (`.github/workflows/cd.yml`)

| | |
|---|---|
| **Trigger** | `push` to `main` |
| **Purpose** | Production build and artifact generation |
| **Secrets** | `VITE_API_URL` |

Builds **all** projects with `nx run-many -t build --all` and uploads artifacts (`dist-web`, `dist-api`) with 90-day retention.

### Release (`.github/workflows/release.yml`)

| | |
|---|---|
| **Trigger** | `push` to `main` |
| **Purpose** | Version management and GitHub Releases via changesets |
| **Secrets** | `RELEASE_APP_ID`, `RELEASE_APP_PRIVATE_KEY` |

Uses a **GitHub App token** (not `GITHUB_TOKEN`) so that the Version PR triggers CI checks. Flow:

1. Changesets exist → creates Version PR (`changeset-release/main` branch) with title `chore: version packages`, label `changeset-release`, and auto-merge enabled
2. No changesets (after Version PR merge) → runs `changeset tag` to create git tags → creates GitHub Releases

### Auto Changeset (`.github/workflows/auto-changeset.yml`)

| | |
|---|---|
| **Trigger** | `pull_request` (opened, edited, synchronize) to `main` |
| **Purpose** | Auto-generate changeset files from PR title |
| **Secrets** | `RELEASE_APP_ID`, `RELEASE_APP_PRIVATE_KEY` |

Parses the PR title (conventional commits format) and generates a changeset file. Uses a **GitHub App token** so the push triggers CI on the new commit. Skips PRs with `changeset-release` label.

### Pre-Release (`.github/workflows/pre-release.yml`)

| | |
|---|---|
| **Trigger** | `create` (branch `release/*`) |
| **Purpose** | Enter changeset pre-release mode (alpha) |

When a `release/*` branch is created, activates changeset pre-release mode and commits `pre.json`.

### PR Title Validation (`.github/workflows/pr-title-validation.yml`)

| | |
|---|---|
| **Trigger** | `pull_request_target` (opened, edited, synchronize) to `main` |
| **Purpose** | Validate PR title follows conventional commits |

Uses `amannn/action-semantic-pull-request@v6`. Valid types: `feat`, `fix`, `chore`, `refactor`, `docs`, `test`, `style`, `perf`, `ci`, `build`. Subject must not start with uppercase.

### Send Reminders (`.github/workflows/send-reminders.yml`)

| | |
|---|---|
| **Trigger** | `schedule` (every 15 minutes) or `workflow_dispatch` |
| **Purpose** | Trigger appointment reminder emails |
| **Secrets** | `API_URL`, `CRON_API_KEY` |

## GitHub App Token

Several workflows use a GitHub App token instead of the default `GITHUB_TOKEN`. This is necessary because GitHub does not trigger workflows from events created by `GITHUB_TOKEN` (to prevent infinite loops).

**App name**: `schedulizer-release`

**Permissions**: Contents (Read & Write), Pull requests (Read & Write), Metadata (Read-only)

**Secrets**:

| Secret | Purpose |
|--------|---------|
| `RELEASE_APP_ID` | GitHub App ID |
| `RELEASE_APP_PRIVATE_KEY` | GitHub App private key (.pem) |

**Workflows using it**: `release.yml`, `auto-changeset.yml`

## Why `npm install` Instead of `npm ci`

`npm ci` fails when `package-lock.json` was generated on a different platform (e.g., macOS locally vs Linux in CI). Platform-specific optional dependencies like `@tailwindcss/oxide-wasm32-wasi` sub-packages are not included in the lockfile when generated on macOS, causing `npm ci` to fail on Linux with "Missing from lock file" errors.

All workflows and Dockerfiles use `npm install --include=dev` instead. Dockerfiles also use `--cache /tmp/npm-cache` for Docker layer caching.

## Secrets

### Required

| Secret | Used in | Purpose |
|--------|---------|---------|
| `RELEASE_APP_ID` | Release, Auto Changeset | GitHub App ID for token generation |
| `RELEASE_APP_PRIVATE_KEY` | Release, Auto Changeset | GitHub App private key |
| `VITE_API_URL` | CD | API URL for frontend production build |

### Optional

| Secret | Used in | Purpose |
|--------|---------|---------|
| `VITE_TURNSTILE_SITE_KEY` | CD | Cloudflare Turnstile site key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | CD | Stripe publishable key |
| `VITE_SENTRY_DSN_WEB` | CD | Sentry DSN for web app |
| `VITE_SENTRY_DSN_LANDING` | CD | Sentry DSN for landing page |
| `VITE_SENTRY_ENVIRONMENT` | CD | Sentry environment identifier |
| `SENTRY_AUTH_TOKEN` | CD | Sentry auth token for source map uploads |
| `SENTRY_ORG` | CD | Sentry organization slug |
| `SENTRY_PROJECT_WEB` | CD | Sentry project for web app |
| `SENTRY_PROJECT_LANDING` | CD | Sentry project for landing page |
| `API_URL` | Send Reminders | Production API URL for cron job |
| `CRON_API_KEY` | Send Reminders | API key for cron authentication |

## Environment Variables

See [env rule](../.claude/rules/env.md) for the centralized environment variable pattern.

### Client Variables (Frontend)

Defined in `/libs/shared/env/src/client.ts`. Must have `VITE_` prefix.

| Variable | Required | Purpose |
|----------|----------|---------|
| `VITE_API_URL` | Yes | Backend API base URL |
| `VITE_TURNSTILE_SITE_KEY` | No | Cloudflare Turnstile public key |
| `VITE_STRIPE_PUBLISHABLE_KEY` | No | Stripe publishable key |
| `VITE_SENTRY_DSN_WEB` | No | Sentry DSN for web app |
| `VITE_SENTRY_DSN_LANDING` | No | Sentry DSN for landing page |
| `VITE_SENTRY_ENVIRONMENT` | No | Sentry environment identifier |

### Server Variables (Backend)

Defined in `/libs/shared/env/src/server.ts`. Must not have `VITE_` prefix.

| Variable | Required | Purpose |
|----------|----------|---------|
| `DATABASE_URL` | Yes | PostgreSQL connection string |
| `SERVER_PORT` | No | Express server port (default: 3000) |
| `BETTER_AUTH_SECRET` | Yes | Secret for token signing (min 32 chars) |
| `BETTER_AUTH_URL` | Yes | Application base URL for auth |
| `RESEND_API_KEY` | Yes | Resend API key for sending emails |
| `TURNSTILE_SECRET_KEY` | No | Cloudflare Turnstile secret key |
| `SENTRY_DSN_API` | No | Sentry DSN for backend |
| `SENTRY_ENVIRONMENT` | No | Sentry environment identifier |

## Troubleshooting

### PR checks show "Waiting for status to be reported"

**Cause**: The auto-changeset workflow pushed a commit using `GITHUB_TOKEN`, and CI didn't trigger for the new HEAD.

**Solution**: This is fixed by using the GitHub App token. If it still happens, close and reopen the PR to force re-evaluation (note: this removes auto-merge).

### `npm ci` fails with "Missing from lock file"

**Cause**: `package-lock.json` generated on a different platform.

**Solution**: Use `npm install --include=dev` instead of `npm ci`. Already configured in all workflows and Dockerfiles.

### Version PR doesn't trigger CI

**Cause**: The PR was created using `GITHUB_TOKEN` instead of the App token.

**Solution**: Verify `release.yml` uses `actions/create-github-app-token@v1` and passes the token to both `actions/checkout` and `changesets/action`.

### `changeset tag` doesn't create tags

**Cause**: No pre-existing tags in the repository. `changeset tag` needs reference tags to detect version changes.

**Solution**: Create initial tags manually for all packages.

### Commitlint rejects merge commits

**Cause**: Using non-standard commit types like `merge:`.

**Solution**: Use `chore:` prefix for merge-related commits.

### `pull_request` workflow changes not taking effect

**Cause**: `pull_request` event uses the workflow file from the **base branch** (main), not the head branch.

**Solution**: Workflow changes only take effect after being merged to main.

## Branch Protection

See [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md) for the full branch protection configuration.

Required status checks for `main`:
- `lint`
- `test`
- `typecheck`
- `docker-build (api, ., apps/api/Dockerfile)`

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nx CI Documentation](https://nx.dev/ci/intro/ci-with-nx)
- [Changesets Documentation](https://github.com/changesets/changesets)
- [Branch Protection Rules](BRANCH_PROTECTION.md)
- [Deploy Guide](DEPLOY.md)
