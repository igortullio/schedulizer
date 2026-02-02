import { serverEnv } from '@schedulizer/env/server'
import { toNodeHandler } from 'better-auth/node'
import cors from 'cors'
import express from 'express'
import { auth } from './lib/auth'

const app = express()

app.use(
  cors({
    origin: 'http://localhost:4200',
    credentials: true,
  }),
)

// Better Auth handler
app.all('/api/auth/{*any}', toNodeHandler(auth))

app.use(express.json())

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.listen(serverEnv.port, () => {
  console.log(`Server running on port ${serverEnv.port}`)
})
