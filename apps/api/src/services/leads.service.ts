import { createDb } from '@schedulizer/db'
import { leads } from '@schedulizer/db/schema'
import { serverEnv } from '@schedulizer/env/server'
import type { CreateLeadRequest, Lead } from '@schedulizer/shared-types'

// Create database connection once at module level
const db = createDb(serverEnv.databaseUrl)

export const leadsService = {
  async createLead(data: CreateLeadRequest): Promise<Lead> {
    const [newLead] = await db
      .insert(leads)
      .values({
        name: data.name,
        email: data.email,
        phone: data.phone,
        planInterest: data.planInterest,
      })
      .returning()

    return {
      id: newLead.id,
      name: newLead.name,
      email: newLead.email,
      phone: newLead.phone,
      planInterest: newLead.planInterest,
      createdAt: newLead.createdAt,
    }
  },
}
