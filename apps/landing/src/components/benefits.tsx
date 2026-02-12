import type { LucideIcon } from 'lucide-react'
import { Bell, Calendar, Clock, Users } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface Benefit {
  icon: LucideIcon
}

const benefitIcons: Benefit[] = [{ icon: Calendar }, { icon: Bell }, { icon: Clock }, { icon: Users }]

export function Benefits() {
  const { t } = useTranslation()
  const benefitItems = t('benefits.items', { returnObjects: true }) as Array<{
    title: string
    description: string
  }>
  return (
    <section className="px-4 py-20 md:py-28">
      <div className="mx-auto max-w-7xl">
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {t('benefits.title')} <span className="gradient-text">{t('benefits.titleHighlight')}</span>?
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{t('benefits.subtitle')}</p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {benefitItems.map((benefit, index) => {
            const Icon = benefitIcons[index].icon
            return (
              <div
                key={benefit.title}
                className="glass hover-lift group cursor-pointer rounded-2xl p-6"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-xl bg-linear-to-br from-primary/15 to-accent/15 transition-transform duration-200 group-hover:scale-110">
                  <Icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="mb-3 text-lg font-semibold text-foreground">{benefit.title}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{benefit.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
