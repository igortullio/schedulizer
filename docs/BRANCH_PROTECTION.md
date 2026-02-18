# Branch Protection Configuration

## Protected Branch: `main`

### Required Status Checks

**Require status checks to pass before merging**: Enabled

**Require branches to be up to date before merging**: Enabled

**Required status checks**:
- `lint` - Code validation with Biome
- `test` - Unit tests with Vitest
- `typecheck` - TypeScript type checking
- `docker-build (api, ., apps/api/Dockerfile)` - Docker build validation

All checks come from the CI workflow (`.github/workflows/ci.yml`).

### Branch Restrictions

- **Allow force pushes**: Disabled
- **Allow deletions**: Disabled
- **Require linear history**: Disabled
- **Lock branch**: Disabled

### Rules Enforcement

- **Do not allow bypassing the above settings**: Enabled
  - Administrators must also follow protection rules

### Pull Request Reviews

- **Require pull request reviews before merging**: Disabled
  - Can optionally be enabled as the team grows

## Additional Resources

- [CI/CD Pipeline Documentation](CI_CD.md)
- [GitHub REST API - Branch Protection](https://docs.github.com/en/rest/branches/branch-protection)
