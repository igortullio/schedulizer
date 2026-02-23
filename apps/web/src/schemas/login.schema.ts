import type { TFunction } from 'i18next'
import { z } from 'zod'

const E164_PATTERN = /^\+[1-9]\d{7,14}$/

export type LoginMode = 'phone' | 'email'

export function createPhoneLoginSchema(t: TFunction) {
  return z.object({
    phone: z
      .string()
      .min(1, { message: t('validation.phoneRequired') })
      .regex(E164_PATTERN, { message: t('validation.invalidPhone') }),
  })
}

export function createEmailLoginSchema(t: TFunction) {
  return z.object({
    email: z
      .string()
      .min(1, { message: t('validation.emailRequired') })
      .email({ message: t('validation.invalidEmail') }),
  })
}

export function createNameSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(1, { message: t('validation.nameRequired') })
      .transform(s => s.trim())
      .refine(s => s.length >= 2, { message: t('validation.nameTooShort') }),
  })
}

export type PhoneFormData = z.infer<ReturnType<typeof createPhoneLoginSchema>>
export type EmailFormData = z.infer<ReturnType<typeof createEmailLoginSchema>>
export type NameFormData = z.infer<ReturnType<typeof createNameSchema>>
