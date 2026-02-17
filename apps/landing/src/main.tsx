import './instrument'
import './lib/i18n/i18n'
import { SentryErrorBoundary } from '@schedulizer/observability'
import { StrictMode } from 'react'
import * as ReactDOM from 'react-dom/client'
import App from './app/app'

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
      <App />
    </SentryErrorBoundary>
  </StrictMode>,
)
