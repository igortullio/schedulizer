# Branch Protection Configuration

## Summary

This document details the branch protection rules configured for the `igortullio/schedulizer` repository.

## Protected Branch: `main`

### Required Status Checks

**Require status checks to pass before merging**: ✅ Enabled

**Require branches to be up to date before merging**: ✅ Enabled (`strict: true`)

**Required status checks**:
- `lint` - Code validation with Biome
- `test` - Unit tests execution with Vitest
- `build` - Production build for apps/web and apps/api

> All checks come from the CI workflow (`.github/workflows/ci.yml`)

### Branch Restrictions

- **Allow force pushes**: ❌ Disabled
- **Allow deletions**: ❌ Disabled
- **Require linear history**: ❌ Disabled
- **Lock branch**: ❌ Disabled

### Rules Enforcement

- **Do not allow bypassing the above settings**: ✅ Enabled (`enforce_admins: true`)
  - Administrators must also follow protection rules

### Pull Request Reviews

- **Require pull request reviews before merging**: ❌ Disabled (`required_pull_request_reviews: null`)
  - Can optionally be enabled in the future as the team grows

## Configuration Command

The configuration was applied via GitHub CLI using:

```bash
gh api \
  --method PUT \
  -H "Accept: application/vnd.github+json" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  /repos/igortullio/schedulizer/branches/main/protection \
  --input branch-protection.json
```

## Validation

To validate the protection rules:

1. Create PR with lint error → merge should be blocked
2. Create PR with failing test → merge should be blocked
3. Create PR with build error → merge should be blocked
4. Create valid PR → merge should be allowed after all checks pass
5. Try force push to main → should be rejected
6. Verify that branch is up to date before merging

## References

- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
- [CI Workflow](.github/workflows/ci.yml)
- [CD Workflow](.github/workflows/cd.yml)

## Applied Date

Configured on: 2026-02-02
