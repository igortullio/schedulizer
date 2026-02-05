interface EnvErrorProps {
  error: string
}

export function EnvError({ error }: EnvErrorProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-50 p-4">
      <div className="max-w-lg rounded-2xl border border-red-200 bg-white p-8 shadow-xl">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
          <svg
            className="h-8 w-8 text-red-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
        </div>
        <h1 className="mb-2 text-2xl font-bold text-gray-900">Configuration Error</h1>
        <p className="mb-4 text-gray-600">The application could not start due to missing configuration.</p>
        <div className="rounded-lg bg-red-50 p-4">
          <p className="font-mono text-sm text-red-800">{error}</p>
        </div>
        <div className="mt-6 border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-500">
            <strong>How to fix:</strong> Copy <code className="rounded bg-gray-100 px-1">.env.example</code> to{' '}
            <code className="rounded bg-gray-100 px-1">.env</code> and fill in the required values.
          </p>
        </div>
      </div>
    </div>
  )
}
