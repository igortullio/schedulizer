import { z } from 'zod'

export const createLeadSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z
    .string()
    .min(1, 'Telefone é obrigatório')
    .regex(/^\+?[\d\s\-()]+$/, 'Formato de telefone inválido'),
  planInterest: z.enum(['essential', 'professional'], {
    errorMap: () => ({ message: 'Plano deve ser "essential" ou "professional"' }),
  }),
})
