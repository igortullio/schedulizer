# Commit Standards

## Language

All commit messages must be written in English

## Conventional Commits

Follow the conventional commits format:

```
type(scope): description
```

### Types

| Type | When to use |
|------|-------------|
| feat | New feature |
| fix | Bug fix |
| refactor | Code change that neither fixes a bug nor adds a feature |
| chore | Maintenance tasks (deps, config, build) |
| docs | Documentation changes |
| test | Adding or updating tests |
| style | Formatting, white-space, lint fixes |
| perf | Performance improvement |
| ci | CI/CD changes |

### Scope

Use the Nx project name as scope when the change is scoped to a single project (e.g., `feat(web): add login page`)

### Description

- Start with a lowercase verb in imperative mood
- Keep under 72 characters
- Do not end with a period

## Validations Before Committing

Before creating a commit, always run:

```bash
npx nx affected -t lint typecheck test
```

- If any validation fails, fix the issues before committing
- Never skip validations with `--no-verify` or `--no-gpg-sign`
- Never amend a previous commit unless the user explicitly asks

## Examples

```bash
# Good
git commit -m "feat(web): add user authentication"
git commit -m "fix(api): handle null response from payment gateway"
git commit -m "chore: update dependencies"
git commit -m "refactor(db): simplify query builder logic"

# Bad
git commit -m "fix bug"           # not descriptive
git commit -m "WIP"               # not meaningful
git commit -m "correção de bug"   # not in English
git commit -m "feat: Add Login."  # uppercase verb, trailing period
```
