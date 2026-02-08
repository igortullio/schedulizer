import type { TFunction } from 'i18next'

export function getSelectionErrorMessage(status: number | undefined, t: TFunction): string {
  if (status === 403) return t('orgSelect.errors.noPermission')
  if (status === 404) return t('orgSelect.errors.notFound')
  return t('orgSelect.errors.failedToSelect')
}
