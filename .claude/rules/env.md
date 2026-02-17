# Environment Variables

## Centralized Management

All environment variables MUST be defined and validated in the `@libs/shared/env` library. Never use `process.env` or `import.meta.env` directly in application code.

### Structure

- `libs/shared/env/src/server.ts` - Server-side variables (accessed via `process.env`)
- `libs/shared/env/src/client.ts` - Client-side variables (accessed via `import.meta.env`, prefixed with `VITE_`)
- `libs/shared/env/src/index.ts` - Public exports

### Adding a New Variable

1. Add the Zod schema entry in `server.ts` or `client.ts`
2. Add the camelCase mapped property in the corresponding `create*Env` function
3. Export the type if needed
4. Add the variable with a placeholder value to `.env.example` under the appropriate section
5. Import from `@schedulizer/env` wherever the variable is used

### Usage

```typescript
// ❌ Avoid - accessing env directly
const port = process.env.SERVER_PORT
const apiUrl = import.meta.env.VITE_API_URL

// ✅ Prefer - import from shared env
import { serverEnv } from '@schedulizer/env'
const port = serverEnv.port

import { clientEnv } from '@schedulizer/env'
const apiUrl = clientEnv.apiUrl
```

### Validation

All variables are validated with Zod at startup. If a required variable is missing or invalid, the application fails fast with a clear error message.

### Naming

- Server variables: `UPPER_SNAKE_CASE` (e.g., `DATABASE_URL`, `STRIPE_SECRET_KEY`)
- Client variables: `VITE_` prefix + `UPPER_SNAKE_CASE` (e.g., `VITE_API_URL`)
- Mapped properties: `camelCase` (e.g., `databaseUrl`, `apiUrl`)
