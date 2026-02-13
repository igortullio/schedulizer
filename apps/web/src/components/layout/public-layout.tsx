import { Outlet } from 'react-router-dom'
import { LanguageSelector } from '@/components/language-selector'

const logoHeader = (
  <div className="flex items-center gap-2">
    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
      <svg
        className="h-5 w-5 text-primary-foreground"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
        aria-hidden="true"
        data-testid="public-layout-logo-icon"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
        />
      </svg>
    </div>
    <span className="text-lg font-bold text-foreground" data-testid="public-layout-logo-text">
      Schedulizer
    </span>
  </div>
)

export function PublicLayout() {
  return (
    <div className="min-h-screen bg-background" data-testid="public-layout">
      <header className="border-b border-border px-4 py-3">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          {logoHeader}
          <LanguageSelector />
        </div>
      </header>
      <main className="mx-auto max-w-2xl px-4 py-6" aria-label="Booking content">
        <Outlet />
      </main>
    </div>
  )
}

export default PublicLayout
