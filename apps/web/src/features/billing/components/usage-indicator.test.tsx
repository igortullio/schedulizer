import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import type { ResourceUsage } from '../types'
import { UsageIndicator } from './usage-indicator'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => acc.replace(`{{${k}}}`, String(v)), key)
      }
      return key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

describe('UsageIndicator', () => {
  it('renders limited usage with progress bar', () => {
    const usage: ResourceUsage = { current: 3, limit: 5, canAdd: true }
    render(<UsageIndicator resource="services" usage={usage} />)
    expect(screen.getByTestId('usage-indicator-services')).toBeInTheDocument()
    expect(screen.getByTestId('usage-count-services')).toHaveTextContent('usageIndicator.limited')
    expect(screen.getByTestId('usage-progress-services')).toBeInTheDocument()
  })

  it('renders nothing when usage is unlimited', () => {
    const usage: ResourceUsage = { current: 8, limit: null, canAdd: true }
    const { container } = render(<UsageIndicator resource="services" usage={usage} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('applies destructive style when at limit', () => {
    const usage: ResourceUsage = { current: 5, limit: 5, canAdd: false }
    render(<UsageIndicator resource="services" usage={usage} />)
    expect(screen.getByTestId('usage-count-services')).toHaveClass('text-destructive')
  })

  it('applies warning style when near limit', () => {
    const usage: ResourceUsage = { current: 4, limit: 5, canAdd: true }
    render(<UsageIndicator resource="services" usage={usage} />)
    expect(screen.getByTestId('usage-count-services').className).toContain('text-yellow')
  })

  it('applies normal style when usage is low', () => {
    const usage: ResourceUsage = { current: 1, limit: 5, canAdd: true }
    render(<UsageIndicator resource="members" usage={usage} />)
    expect(screen.getByTestId('usage-count-members')).toHaveClass('text-foreground')
  })

  it('sets correct aria attributes on progress bar', () => {
    const usage: ResourceUsage = { current: 3, limit: 5, canAdd: true }
    render(<UsageIndicator resource="services" usage={usage} />)
    const progressbar = screen.getByRole('progressbar')
    expect(progressbar).toHaveAttribute('aria-valuenow', '3')
    expect(progressbar).toHaveAttribute('aria-valuemin', '0')
    expect(progressbar).toHaveAttribute('aria-valuemax', '5')
  })
})
