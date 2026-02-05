import path from 'node:path'
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

import * as schema from './schema'

export function createDb(connectionString: string) {
  const client = postgres(connectionString)
  return drizzle(client, { schema })
}

export async function runMigrations(connectionString: string) {
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  console.log('Running migrations...')
  await migrate(db, {
    migrationsFolder: path.join(__dirname, '../drizzle'),
  })
  console.log('Migrations completed')

  await client.end()
}

export * from './schema'
export { schema }
