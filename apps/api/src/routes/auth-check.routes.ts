import { createDb, schema } from '@schedulizer/db'
import { serverEnv } from '@schedulizer/env/server'
import { eq } from 'drizzle-orm'
import { Router } from 'express'
import { z } from 'zod'

const router = Router()
const db = createDb(serverEnv.databaseUrl)

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

const checkPhoneSchema = z.object({
  phone: z.string().regex(E164_PATTERN, 'Invalid phone number'),
})

const checkEmailSchema = z.object({
  email: z.string().email('Invalid email'),
})

router.get('/check-phone', async (req, res) => {
  const parsed = checkPhoneSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid phone number' })
  }
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.phoneNumber, parsed.data.phone))
    .limit(1)
  return res.status(200).json({ exists: Boolean(user) })
})

router.get('/check-email', async (req, res) => {
  const parsed = checkEmailSchema.safeParse(req.query)
  if (!parsed.success) {
    return res.status(400).json({ error: 'Invalid email' })
  }
  const [user] = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .where(eq(schema.users.email, parsed.data.email))
    .limit(1)
  return res.status(200).json({ exists: Boolean(user) })
})

export const authCheckRoutes = router
