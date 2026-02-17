import * as Sentry from '@sentry/react'
import { Component, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  fallback: ReactNode | ((error: Error) => ReactNode)
  context?: string
  children: ReactNode
}

interface ErrorBoundaryState {
  error: Error | null
}

class SentryErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  override componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    Sentry.withScope(scope => {
      if (this.props.context) {
        scope.setTag('errorBoundary', this.props.context)
      }
      scope.setExtra('componentStack', errorInfo.componentStack)
      Sentry.captureException(error)
    })
  }

  override render(): ReactNode {
    if (this.state.error) {
      const { fallback } = this.props
      if (typeof fallback === 'function') {
        return fallback(this.state.error)
      }
      return fallback
    }
    return this.props.children
  }
}

export type { ErrorBoundaryProps }
export { SentryErrorBoundary }
