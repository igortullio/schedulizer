# Web (Frontend)

React + Vite + Tailwind + Shadcn frontend.

## Structure

- `src/components/` - Reusable React components
- `src/routes/` - Page components / routes
- `src/hooks/` - Custom React hooks
- `src/lib/` - Utilities and configuration

## Patterns

- Components in PascalCase, hooks prefixed with `use`
- Convert UTC timestamps from API to local time for display
- Use `@schedulizer/env/client` (clientEnv) for environment variables
- Environment variables must be prefixed with `VITE_`
