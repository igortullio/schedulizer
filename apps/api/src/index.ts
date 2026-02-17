import { serverEnv } from '@schedulizer/env/server'
import { captureWithContext, sentryContextMiddleware } from '@schedulizer/observability'
import * as Sentry from '@sentry/node'
import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express from 'express'
import { auth } from './lib/auth'
import { appointmentsRoutes } from './routes/appointments.routes'
import { billingRoutes, webhookRouter } from './routes/billing.routes'
import { bookingRoutes } from './routes/booking.routes'
import { healthRoutes } from './routes/health.routes'
import { leadsRoutes } from './routes/leads.routes'
import { invitationsRoutes, membersRoutes } from './routes/members.routes'
import { notificationsRoutes } from './routes/notifications.routes'
import { organizationsRoutes } from './routes/organizations.routes'
import { schedulesRoutes } from './routes/schedules.routes'
import { servicesRoutes } from './routes/services.routes'
import { timeBlocksRoutes } from './routes/time-blocks.routes'

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
app.use(sentryContextMiddleware)

// Routes
app.use('/api/billing', billingRoutes)
app.use('/api/leads', leadsRoutes)
app.use('/api/organizations', organizationsRoutes)
app.use('/api/services', servicesRoutes)
app.use('/api/services', schedulesRoutes)
app.use('/api/time-blocks', timeBlocksRoutes)
app.use('/api/appointments', appointmentsRoutes)
app.use('/api/booking', bookingRoutes)
app.use('/api/invitations', invitationsRoutes)
app.use('/api/members', membersRoutes)
app.use('/api/notifications', notificationsRoutes)

// Health check
app.use('/health', healthRoutes)

if (serverEnv.sentryEnvironment !== 'production') {
  app.get('/api/sentry-debug', () => {
    throw new Error('Sentry integration test error')
  })
}

Sentry.setupExpressErrorHandler(app)

// Global error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  captureWithContext(err, { level: 'error' })
  console.error('Unhandled error', {
    error: err.message,
    stack: err.stack,
  })
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(serverEnv.port, () => {
  console.log(`Server running on port ${serverEnv.port}`)
})
