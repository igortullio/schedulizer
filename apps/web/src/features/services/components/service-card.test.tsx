import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ServiceCard } from './service-card'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const defaultProps = {
  id: 'service-1',
  name: 'Haircut',
  description: 'A nice haircut',
  durationMinutes: 30,
  price: '50.00',
  active: true,
  onEdit: vi.fn(),
  onDelete: vi.fn(),
  onToggleActive: vi.fn(),
}

describe('ServiceCard', () => {
  it('renders service name', () => {
    render(<ServiceCard {...defaultProps} />)
    expect(screen.getByTestId('service-name')).toHaveTextContent('Haircut')
  })

  it('renders service description', () => {
    render(<ServiceCard {...defaultProps} />)
    expect(screen.getByTestId('service-description')).toHaveTextContent('A nice haircut')
  })

  it('does not render description when null', () => {
    render(<ServiceCard {...defaultProps} description={null} />)
    expect(screen.queryByTestId('service-description')).not.toBeInTheDocument()
  })

  it('renders duration', () => {
    render(<ServiceCard {...defaultProps} />)
    expect(screen.getByTestId('service-duration')).toHaveTextContent('30')
  })

  it('renders price', () => {
    render(<ServiceCard {...defaultProps} />)
    expect(screen.getByTestId('service-price')).toHaveTextContent('R$ 50.00')
  })

  it('does not render price when null', () => {
    render(<ServiceCard {...defaultProps} price={null} />)
    expect(screen.queryByTestId('service-price')).not.toBeInTheDocument()
  })

  it('renders active status badge', () => {
    render(<ServiceCard {...defaultProps} />)
    expect(screen.getByTestId('service-status')).toHaveTextContent('status.active')
  })

  it('renders inactive status badge', () => {
    render(<ServiceCard {...defaultProps} active={false} />)
    expect(screen.getByTestId('service-status')).toHaveTextContent('status.inactive')
  })

  it('calls onEdit when edit button is clicked', async () => {
    const user = userEvent.setup()
    const onEdit = vi.fn()
    render(<ServiceCard {...defaultProps} onEdit={onEdit} />)
    await user.click(screen.getByTestId('edit-service-button'))
    expect(onEdit).toHaveBeenCalledWith('service-1')
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<ServiceCard {...defaultProps} onDelete={onDelete} />)
    await user.click(screen.getByTestId('delete-service-button'))
    expect(onDelete).toHaveBeenCalledWith('service-1')
  })

  it('calls onToggleActive when toggle button is clicked', async () => {
    const user = userEvent.setup()
    const onToggleActive = vi.fn()
    render(<ServiceCard {...defaultProps} onToggleActive={onToggleActive} />)
    await user.click(screen.getByTestId('toggle-active-button'))
    expect(onToggleActive).toHaveBeenCalledWith('service-1', false)
  })

  it('shows activate text when service is inactive', () => {
    render(<ServiceCard {...defaultProps} active={false} />)
    expect(screen.getByTestId('toggle-active-button')).toHaveTextContent('actions.activate')
  })

  it('shows deactivate text when service is active', () => {
    render(<ServiceCard {...defaultProps} active={true} />)
    expect(screen.getByTestId('toggle-active-button')).toHaveTextContent('actions.deactivate')
  })
})
