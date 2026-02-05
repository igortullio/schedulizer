import { Calendar, Mail, Phone } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Footer() {
  const { t } = useTranslation()
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t border-border/50 bg-foreground/[0.02] px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid gap-12 md:grid-cols-3">
          <div>
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
                <Calendar className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold text-foreground">Schedulizer</span>
            </div>
            <p className="max-w-xs text-sm leading-relaxed text-muted-foreground">{t('footer.brandDescription')}</p>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              {t('footer.sections.links.title')}
            </h3>
            <ul className="space-y-3">
              <li>
                <a
                  href="/privacy"
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  {t('footer.sections.links.privacy')}
                </a>
              </li>
              <li>
                <a
                  href="/terms"
                  className="text-sm text-muted-foreground transition-colors duration-200 hover:text-primary"
                >
                  {t('footer.sections.links.terms')}
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 text-sm font-semibold uppercase tracking-wider text-foreground">
              {t('footer.sections.contact.title')}
            </h3>
            <ul className="space-y-3">
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">contato@schedulizer.com</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <span className="text-sm text-muted-foreground">+1 (555) 123-4567</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-border/50 pt-8 text-center">
          <p className="text-sm text-muted-foreground">{t('footer.copyright', { year: currentYear })}</p>
        </div>
      </div>
    </footer>
  )
}
