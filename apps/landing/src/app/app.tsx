import { Button } from '@igortullio-ui/react'
import { clientEnv, getEnvError, hasEnvError } from '@schedulizer/env/client'
import { Menu, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Benefits } from '@/components/benefits'
import { EnvError } from '@/components/env-error'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { LanguageSelector } from '@/components/language-selector'
import { LeadForm } from '@/components/lead-form'
import { Pricing } from '@/components/pricing'
import { useDocumentMeta } from '@/hooks/useDocumentMeta'

export function App() {
  useDocumentMeta()
  const { t } = useTranslation()
  const leadFormRef = useRef<HTMLDivElement>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const envError = getEnvError()
  if (hasEnvError() && envError) {
    return <EnvError error={envError} />
  }
  function handleGetStarted() {
    const webUrl = clientEnv.webUrl
    if (webUrl) {
      window.location.href = `${webUrl}/pricing`
      return
    }
    leadFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }
  function handleMobileNavClick(href: string) {
    setIsMobileMenuOpen(false)
    const element = document.querySelector(href)
    element?.scrollIntoView({ behavior: 'smooth' })
  }
  return (
    <div className="min-h-screen">
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
        <div className="glass rounded-2xl px-4 py-3 shadow-lg sm:px-6 sm:py-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary">
                <svg
                  className="h-5 w-5 text-primary-foreground"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <span className="truncate text-xl font-bold text-foreground">Schedulizer</span>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <a
                href="#benefits"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.benefits')}
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.pricing')}
              </a>
              <a
                href="#lead-form"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.contact')}
              </a>
              <LanguageSelector />
            </nav>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                onClick={handleGetStarted}
                className="gradient-accent shrink-0 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg sm:px-5 sm:py-2.5"
              >
                {t('nav.cta')}
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="md:hidden"
                aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
          {isMobileMenuOpen ? (
            <nav className="mt-3 flex flex-col gap-3 border-t border-border/50 pt-3 md:hidden">
              <button
                type="button"
                onClick={() => handleMobileNavClick('#benefits')}
                className="text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.benefits')}
              </button>
              <button
                type="button"
                onClick={() => handleMobileNavClick('#pricing')}
                className="text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.pricing')}
              </button>
              <button
                type="button"
                onClick={() => handleMobileNavClick('#lead-form')}
                className="text-left text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                {t('nav.contact')}
              </button>
              <LanguageSelector />
            </nav>
          ) : null}
        </div>
      </header>

      <main className="gradient-hero overflow-hidden pt-24">
        <Hero onCtaClick={handleGetStarted} />

        <div id="benefits">
          <Benefits />
        </div>

        <div id="pricing">
          <Pricing />
        </div>

        <div ref={leadFormRef} id="lead-form">
          <LeadForm />
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App
