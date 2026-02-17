import './instrument'
import './lib/i18n'
import { SentryErrorBoundary } from '@schedulizer/observability/browser'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import './styles.css'

const globalFallback = (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h1>Something went wrong</h1>
    <p>An unexpected error occurred. Please reload the page.</p>
    <button type="button" onClick={() => window.location.reload()}>
      Reload
    </button>
  </div>
)

const root = ReactDOM.createRoot(document.getElementById('root') as HTMLElement)

root.render(
  <StrictMode>
    <SentryErrorBoundary fallback={globalFallback} context="global">
      <RouterProvider router={router} />
    </SentryErrorBoundary>
  </StrictMode>,
)
