import { serverEnv } from '@schedulizer/env/server'
import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express from 'express'
import { auth } from './lib/auth'
import { leadsRoutes } from './routes/leads.routes'

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

app.use(express.json())

// Routes
app.use('/api/leads', leadsRoutes)

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(serverEnv.port, () => {
  console.log(`Server running on port ${serverEnv.port}`)
})
