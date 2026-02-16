import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { PlanLimitBanner } from './plan-limit-banner'

const mockNavigate = vi.fn()

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

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

describe('PlanLimitBanner', () => {
  it('renders banner for services limit', () => {
    render(<PlanLimitBanner resource="services" current={5} limit={5} />)
    expect(screen.getByTestId('plan-limit-banner-services')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  it('renders banner for members limit', () => {
    render(<PlanLimitBanner resource="members" current={1} limit={1} />)
    expect(screen.getByTestId('plan-limit-banner-members')).toBeInTheDocument()
  })

  it('displays upgrade button', () => {
    render(<PlanLimitBanner resource="services" current={5} limit={5} />)
    expect(screen.getByTestId('upgrade-button-services')).toBeInTheDocument()
  })

  it('navigates to pricing page on upgrade click', async () => {
    const user = userEvent.setup()
    render(<PlanLimitBanner resource="services" current={5} limit={5} />)
    await user.click(screen.getByTestId('upgrade-button-services'))
    expect(mockNavigate).toHaveBeenCalledWith('/pricing?plan=professional')
  })
})
