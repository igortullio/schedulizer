import type { TFunction } from 'i18next'
import { z } from 'zod'

const MIN_NAME_LENGTH = 2
const MAX_NAME_LENGTH = 100

export function createOrganizationSchema(t: TFunction) {
  return z.object({
    name: z
      .string()
      .min(1, { message: t('validation.orgNameRequired') })
      .min(MIN_NAME_LENGTH, { message: t('validation.orgNameMin', { min: MIN_NAME_LENGTH }) })
      .max(MAX_NAME_LENGTH, { message: t('validation.orgNameMax', { max: MAX_NAME_LENGTH }) }),
  })
}

export type CreateOrganizationFormData = z.infer<ReturnType<typeof createOrganizationSchema>>
