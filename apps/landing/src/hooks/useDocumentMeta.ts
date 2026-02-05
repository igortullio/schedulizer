import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'

export function useDocumentMeta() {
  const { t, i18n } = useTranslation()
  useEffect(() => {
    document.title = t('meta.title')
    document.documentElement.lang = i18n.language
    const metaDescription = document.querySelector('meta[name="description"]')
    if (metaDescription) {
      metaDescription.setAttribute('content', t('meta.description'))
    }
  }, [t, i18n.language])
}
