import { Button } from '@igortullio-ui/react'
import { Calendar, Clock, Sparkles } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface HeroProps {
  onCtaClick?: () => void
}

export function Hero({ onCtaClick }: HeroProps) {
  const { t } = useTranslation()
  return (
    <section className="relative px-4 py-20 md:py-28 lg:py-36">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-60 -right-60 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-60 -left-60 h-[500px] w-[500px] rounded-full bg-accent/10 blur-3xl" />
      </div>

      <div className="relative mx-auto max-w-5xl text-center">
        <div className="animate-fade-in-up mb-6 inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-sm font-medium text-primary">
          <Sparkles className="h-4 w-4" />
          <span>{t('hero.badge')}</span>
        </div>

        <h1 className="animate-fade-in-up stagger-1 mb-6 text-4xl font-bold leading-tight tracking-tight text-foreground md:text-5xl lg:text-6xl">
          {t('hero.title')} <span className="gradient-text">{t('hero.titleHighlight')}</span>
        </h1>

        <p className="animate-fade-in-up stagger-2 mx-auto mb-10 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl">
          {t('hero.subtitle')}
        </p>

        <div className="animate-fade-in-up stagger-3 mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Button
            size="lg"
            onClick={onCtaClick}
            className="gradient-accent cursor-pointer border-0 px-8 py-6 text-base font-semibold shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl"
          >
            {t('hero.cta.primary')}
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="cursor-pointer px-8 py-6 text-base font-semibold transition-all duration-200 hover:bg-primary/5"
          >
            {t('hero.cta.secondary')}
          </Button>
        </div>

        <div className="animate-fade-in-up stagger-4 flex flex-wrap items-center justify-center gap-8 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>{t('hero.features.scheduling')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            <span>{t('hero.features.setup')}</span>
          </div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>{t('hero.features.trial')}</span>
          </div>
        </div>
      </div>
    </section>
  )
}
