import { createDb } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { sql } from 'drizzle-orm'
import { Router } from 'express'

const router = Router()
const db = createDb(serverEnv.databaseUrl)
const startTime = Date.now()

const MS_PER_SECOND = 1000
const MS_PER_MINUTE = 60 * MS_PER_SECOND
const MS_PER_HOUR = 60 * MS_PER_MINUTE

function formatUptime(uptimeMs: number): string {
  const hours = Math.floor(uptimeMs / MS_PER_HOUR)
  const minutes = Math.floor((uptimeMs % MS_PER_HOUR) / MS_PER_MINUTE)
  return `${hours}h ${minutes}m`
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await db.execute(sql`SELECT 1`)
    return true
  } catch {
    return false
  }
}

router.get('/', async (_req, res) => {
  const isDatabaseConnected = await checkDatabaseConnection()
  const uptimeMs = Date.now() - startTime
  const status = isDatabaseConnected ? 'healthy' : 'degraded'
  const databaseStatus = isDatabaseConnected ? 'connected' : 'disconnected'
  return res.status(200).json({
    status,
    timestamp: new Date().toISOString(),
    services: {
      database: databaseStatus,
      uptime: formatUptime(uptimeMs),
    },
  })
})

export const healthRoutes = router
