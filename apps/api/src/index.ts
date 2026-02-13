import { serverEnv } from '@schedulizer/env/server'
import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express from 'express'
import { auth } from './lib/auth'
import { billingRoutes, webhookRouter } from './routes/billing.routes'
import { leadsRoutes } from './routes/leads.routes'
import { organizationsRoutes } from './routes/organizations.routes'
import { servicesRoutes } from './routes/services.routes'

const app = express()

app.use(
  cors({
    origin: [
      'http://localhost:4200',
      'http://localhost:4201',
      'http://localhost:4300',
      'https://schedulizer.me',
      'https://www.schedulizer.me',
      'https://app.schedulizer.me',
    ],
    credentials: true,
  }),
)

// Better Auth handler
app.all('/api/auth/{*any}', toNodeHandler(auth))

// Webhook routes (must be before express.json() for raw body access)
app.use('/api/billing', webhookRouter)

app.use(express.json())

// Routes
app.use('/api/billing', billingRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/organizations', organizationsRoutes)
app.use('/api/services', servicesRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  })
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(serverEnv.port, () => {
  console.log(`Server running on port ${serverEnv.port}`)
})
