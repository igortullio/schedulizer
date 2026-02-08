import type { TFunction } from 'i18next'
import { z } from 'zod'

export function createLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('validation.emailRequired') })
      .email({ message: t('validation.invalidEmail') }),
  })
}

export type LoginFormData = z.infer<ReturnType<typeof createLoginSchema>>
