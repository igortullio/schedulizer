import { getEnvError, hasEnvError } from '@schedulizer/env/client'
import { useRef, useState } from 'react'
import { Benefits } from '@/components/benefits'
import { EnvError } from '@/components/env-error'
import { Footer } from '@/components/footer'
import { Hero } from '@/components/hero'
import { LanguageSelector } from '@/components/language-selector'
import { LeadForm } from '@/components/lead-form'
import { Pricing } from '@/components/pricing'

export function App() {
  const envError = getEnvError()
  if (hasEnvError() && envError) {
    return <EnvError error={envError} />
  }
  const leadFormRef = useRef<HTMLDivElement>(null)
  const [selectedPlan, setSelectedPlan] = useState<'essential' | 'professional'>('essential')

  const scrollToForm = () => {
    leadFormRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const handlePlanSelect = (planId: 'essential' | 'professional') => {
    setSelectedPlan(planId)
    scrollToForm()
  }

  return (
    <div className="min-h-screen">
      {/* Floating Glassmorphism Header */}
      <header className="fixed top-4 left-4 right-4 z-50 mx-auto max-w-7xl">
        <div className="glass rounded-2xl px-6 py-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
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
              <span className="text-xl font-bold text-foreground">Schedulizer</span>
            </div>
            <nav className="hidden items-center gap-6 md:flex">
              <a
                href="#benefits"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                Benefícios
              </a>
              <a
                href="#pricing"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                Preços
              </a>
              <a
                href="#lead-form"
                className="text-sm font-medium text-muted-foreground transition-colors duration-200 hover:text-primary"
              >
                Contato
              </a>
              <LanguageSelector />
            </nav>
            <button
              type="button"
              onClick={scrollToForm}
              className="gradient-accent cursor-pointer rounded-xl px-5 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:scale-105 hover:shadow-lg"
            >
              Começar agora
            </button>
          </div>
        </div>
      </header>

      {/* Main Content with top padding for fixed header */}
      <main className="pt-24">
        {/* Hero Section */}
        <Hero onCtaClick={scrollToForm} />

        {/* Benefits Section */}
        <div id="benefits">
          <Benefits />
        </div>

        {/* Pricing Section */}
        <div id="pricing">
          <Pricing onPlanSelect={handlePlanSelect} />
        </div>

        {/* Lead Form Section */}
        <div ref={leadFormRef} id="lead-form">
          <LeadForm defaultPlanInterest={selectedPlan} />
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

export default App
