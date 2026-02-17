import { createDb, schema } from '@schedulizer/db'
import { randomUUID } from 'crypto'
import { desc, eq, like } from 'drizzle-orm'

const DATABASE_URL = 'postgresql://schedulizer:schedulizer@localhost:5432/schedulizer'
const QUERY_TIMEOUT_MS = 5000
const TOKEN_EXPIRATION_MS = 600000

export const db = createDb(DATABASE_URL)

export async function getVerificationToken(email: string): Promise<string | null> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), QUERY_TIMEOUT_MS),
    )

    const queryPromise = db
      .select({ value: schema.verifications.value })
      .from(schema.verifications)
      .where(eq(schema.verifications.identifier, email))
      .orderBy(desc(schema.verifications.createdAt))
      .limit(1)

    const result = await Promise.race([queryPromise, timeoutPromise])

    if (result.length === 0) {
      return null
    }

    return result[0].value
  } catch (error) {
    console.error('Failed to get verification token', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

export async function ensureUserExists(email: string, name: string = 'E2E Test User'): Promise<void> {
  try {
    console.log('Ensuring user exists', { email })

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database query timeout')), QUERY_TIMEOUT_MS),
    )

    const existingUser = await Promise.race([
      db.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email)).limit(1),
      timeoutPromise,
    ])

    console.log('Existing user query result', { email, count: existingUser.length })

    if (existingUser.length === 0) {
      const insertPromise = db.insert(schema.users).values({
        email,
        name,
        emailVerified: true,
      })

      await Promise.race([insertPromise, timeoutPromise])

      console.log('User created successfully', { email })
    } else {
      console.log('User already exists', { email })
    }
  } catch (error) {
    console.error('Failed to ensure user exists', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
    })
    throw error
  }
}

export async function createVerificationToken(email: string): Promise<string> {
  try {
    await ensureUserExists(email)

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database insert timeout')), QUERY_TIMEOUT_MS),
    )

    const token = randomUUID()
    const expiresAt = new Date(Date.now() + TOKEN_EXPIRATION_MS)

    const insertPromise = db.insert(schema.verifications).values({
      identifier: email,
      value: token,
      expiresAt,
    })

    await Promise.race([insertPromise, timeoutPromise])

    console.log('Verification token created', { email })

    return token
  } catch (error) {
    console.error('Failed to create verification token', {
      email,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}

export async function cleanupTestData(emailPrefix: string = 'e2e-'): Promise<void> {
  try {
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('Database cleanup timeout')), QUERY_TIMEOUT_MS),
    )

    const pattern = `${emailPrefix}%`

    const cleanupPromise = db
      .delete(schema.verifications)
      .where(like(schema.verifications.identifier, pattern))

    await Promise.race([cleanupPromise, timeoutPromise])

    console.log('Test data cleaned up', { emailPrefix })
  } catch (error) {
    console.error('Failed to cleanup test data', {
      emailPrefix,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    throw error
  }
}
