import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { WhatsAppGating } from './whatsapp-gating'

const mockNavigate = vi.fn()

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
}))

describe('WhatsAppGating', () => {
  it('renders gating UI when WhatsApp is not available', () => {
    render(<WhatsAppGating isAvailable={false} />)
    expect(screen.getByTestId('whatsapp-gating')).toBeInTheDocument()
    expect(screen.getByText('whatsappGating.title')).toBeInTheDocument()
    expect(screen.getByText('whatsappGating.badge')).toBeInTheDocument()
  })

  it('renders nothing when WhatsApp is available', () => {
    const { container } = render(<WhatsAppGating isAvailable={true} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('displays upgrade button', () => {
    render(<WhatsAppGating isAvailable={false} />)
    expect(screen.getByTestId('whatsapp-upgrade-button')).toBeInTheDocument()
  })

  it('navigates to pricing page on upgrade click', async () => {
    const user = userEvent.setup()
    render(<WhatsAppGating isAvailable={false} />)
    await user.click(screen.getByTestId('whatsapp-upgrade-button'))
    expect(mockNavigate).toHaveBeenCalledWith('/pricing?plan=professional')
  })
})
