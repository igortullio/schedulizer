import { Outlet } from 'react-router-dom'

export function AuthLayout() {
  return (
    <div
      className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 py-8"
      data-testid="auth-layout"
    >
      <div className="mb-8 flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
          <svg
            className="h-6 w-6 text-primary-foreground"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
            data-testid="auth-layout-logo-icon"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
        <span className="text-2xl font-bold text-foreground" data-testid="auth-layout-logo-text">
          Schedulizer
        </span>
      </div>
      <main className="w-full max-w-md" aria-label="Authentication content">
        <Outlet />
      </main>
    </div>
  )
}

export default AuthLayout
