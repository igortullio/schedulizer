import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.email('Invalid email'),
  phone: z
    .string()
    .min(1, 'Phone is required')
    .regex(/^\+?[\d\s\-()]+$/, 'Invalid phone format'),
  planInterest: z.enum(['essential', 'professional'], {
    message: 'Plan must be "essential" or "professional"',
  }),
})
