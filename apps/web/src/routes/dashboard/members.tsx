import { useTranslation } from 'react-i18next'

export function Component() {
  const { t } = useTranslation('dashboard')
  return (
    <div>
      <h1 className="text-2xl font-bold">{t('sidebar.members')}</h1>
    </div>
  )
}
