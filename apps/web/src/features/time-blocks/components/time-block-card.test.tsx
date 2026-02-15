import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { TimeBlockCard } from './time-block-card'

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
  id: 'tb-1',
  date: '2025-03-15',
  startTime: '09:00',
  endTime: '12:00',
  reason: 'Doctor appointment',
  onDelete: vi.fn(),
}

describe('TimeBlockCard', () => {
  it('renders the card container', () => {
    render(<TimeBlockCard {...defaultProps} />)
    expect(screen.getByTestId('time-block-card-tb-1')).toBeInTheDocument()
  })

  it('renders the time range', () => {
    render(<TimeBlockCard {...defaultProps} />)
    expect(screen.getByText('09:00 - 12:00')).toBeInTheDocument()
  })

  it('renders the reason when provided', () => {
    render(<TimeBlockCard {...defaultProps} />)
    expect(screen.getByText('Doctor appointment')).toBeInTheDocument()
  })

  it('does not render reason when null', () => {
    render(<TimeBlockCard {...defaultProps} reason={null} />)
    expect(screen.queryByText(/Doctor appointment/)).not.toBeInTheDocument()
  })

  it('renders delete button', () => {
    render(<TimeBlockCard {...defaultProps} />)
    expect(screen.getByTestId('delete-time-block-tb-1')).toBeInTheDocument()
  })

  it('calls onDelete when delete button is clicked', async () => {
    const user = userEvent.setup()
    const onDelete = vi.fn()
    render(<TimeBlockCard {...defaultProps} onDelete={onDelete} />)
    await user.click(screen.getByTestId('delete-time-block-tb-1'))
    expect(onDelete).toHaveBeenCalledWith('tb-1')
  })

  it('renders delete button as icon-only', () => {
    render(<TimeBlockCard {...defaultProps} />)
    expect(screen.getByTestId('delete-time-block-tb-1')).toBeInTheDocument()
  })
})
