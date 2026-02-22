import { Calendar } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Footer } from '@/components/footer'
import { LanguageSelector } from '@/components/language-selector'

interface PolicySectionProps {
  title: string
  content: string
  items?: string[]
  additional?: string
}

function PolicySection({ title, content, items, additional }: PolicySectionProps) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-xl font-semibold text-foreground">{title}</h2>
      <p className="text-muted-foreground">{content}</p>
      {items ? (
        <ul className="mt-3 list-disc space-y-1 pl-6 text-muted-foreground">
          {items.map(item => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ) : null}
      {additional ? <p className="mt-3 font-medium text-muted-foreground">{additional}</p> : null}
    </section>
  )
}

const SECTION_KEYS = [
  'dataCollection',
  'dataUsage',
  'whatsapp',
  'cookies',
  'sharing',
  'retention',
  'rights',
  'security',
  'contact',
  'updates',
] as const

export function Component() {
  const { t } = useTranslation('privacy')
  return (
    <div className="min-h-screen">
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
        <div className="glass rounded-2xl px-4 py-3 shadow-lg sm:px-6 sm:py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Schedulizer</span>
            </Link>
            <LanguageSelector />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 pt-28 pb-16">
        <h1 className="mb-2 text-3xl font-bold text-foreground">{t('title')}</h1>
        <p className="mb-8 text-sm text-muted-foreground">{t('effectiveDate')}</p>
        <p className="mb-10 text-muted-foreground">{t('intro')}</p>
        {SECTION_KEYS.map(key => {
          const items = t(`sections.${key}.items`, { returnObjects: true, defaultValue: '' })
          const additional = t(`sections.${key}.additional`, { defaultValue: '' })
          return (
            <PolicySection
              key={key}
              title={t(`sections.${key}.title`)}
              content={t(`sections.${key}.content`)}
              items={Array.isArray(items) ? items : undefined}
              additional={additional || undefined}
            />
          )
        })}
      </main>
      <Footer />
    </div>
  )
}

export default Component
