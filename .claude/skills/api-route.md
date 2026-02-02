# API Route Skill

Cria nova rota no backend seguindo a estrutura padrão.

## Estrutura de Rota

### Arquivo de Rotas

Criar em `apps/api/src/routes/<nome>.routes.ts`:

```typescript
import { Router } from 'express'
import { z } from 'zod'

const router = Router()

// Validação com Zod
const createSchema = z.object({
  name: z.string().min(1),
  // ...outros campos
})

// GET - Listar
router.get('/', async (req, res) => {
  // Sempre filtrar por organizationId
  const { organizationId } = req.query
  // ...
  res.json({ data: [] })
})

// GET - Buscar por ID
router.get('/:id', async (req, res) => {
  const { id } = req.params
  // ...
  res.json({ data: {} })
})

// POST - Criar
router.post('/', async (req, res) => {
  const result = createSchema.safeParse(req.body)
  if (!result.success) {
    return res.status(400).json({ error: result.error })
  }
  // ...
  res.status(201).json({ data: {} })
})

// PUT - Atualizar
router.put('/:id', async (req, res) => {
  const { id } = req.params
  // ...
  res.json({ data: {} })
})

// DELETE - Remover
router.delete('/:id', async (req, res) => {
  const { id } = req.params
  // ...
  res.status(204).send()
})

export { router as nomeRoutes }
```

### Registrar Rota

Em `apps/api/src/index.ts`:

```typescript
import { nomeRoutes } from './routes/nome.routes'

// Após middlewares
app.use('/api/nome', nomeRoutes)
```

## Padrões

- Sempre validar entrada com Zod
- Filtrar por organizationId para multi-tenancy
- Usar status codes HTTP corretos
- Retornar formato consistente: `{ data: ... }` ou `{ error: ... }`
