import { z } from 'zod'

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100

export const createOrganizationSchema = z.object({
  name: z
    .string()
    .min(1, { message: 'Organization name is required' })
    .min(MIN_NAME_LENGTH, { message: `Name must be at least ${MIN_NAME_LENGTH} characters` })
    .max(MAX_NAME_LENGTH, { message: `Name must be at most ${MAX_NAME_LENGTH} characters` }),
})

export type CreateOrganizationFormData = z.infer<typeof createOrganizationSchema>
