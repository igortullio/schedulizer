import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ConflictDialog } from './conflict-dialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const mockConflicts = [
  {
    id: 'apt-2',
    customerName: 'Jane Doe',
    startDatetime: '2025-06-15T14:00:00.000Z',
    endDatetime: '2025-06-15T14:30:00.000Z',
  },
  {
    id: 'apt-3',
    customerName: 'Bob Smith',
    startDatetime: '2025-06-15T14:15:00.000Z',
    endDatetime: '2025-06-15T14:45:00.000Z',
  },
]

const defaultProps = {
  isOpen: true,
  conflictingAppointments: mockConflicts,
  onConfirm: vi.fn(),
  onCancel: vi.fn(),
}

describe('ConflictDialog', () => {
  it('renders conflicting appointment details', () => {
    render(<ConflictDialog {...defaultProps} />)
    expect(screen.getByTestId('conflict-dialog')).toBeInTheDocument()
    expect(screen.getByText('Jane Doe')).toBeInTheDocument()
    expect(screen.getByText('Bob Smith')).toBeInTheDocument()
  })

  it('renders correct number of conflicting appointments', () => {
    render(<ConflictDialog {...defaultProps} />)
    const items = screen.getAllByTestId('conflict-item')
    expect(items).toHaveLength(2)
  })

  it('calls onConfirm when force button is clicked', async () => {
    const onConfirm = vi.fn()
    render(<ConflictDialog {...defaultProps} onConfirm={onConfirm} />)
    const user = userEvent.setup()
    await user.click(screen.getByTestId('conflict-confirm'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button is clicked', async () => {
    const onCancel = vi.fn()
    render(<ConflictDialog {...defaultProps} onCancel={onCancel} />)
    const user = userEvent.setup()
    await user.click(screen.getByTestId('conflict-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('does not render content when dialog is closed', () => {
    render(<ConflictDialog {...defaultProps} isOpen={false} />)
    expect(screen.queryByTestId('conflict-dialog')).not.toBeInTheDocument()
  })

  it('renders dialog title and description', () => {
    render(<ConflictDialog {...defaultProps} />)
    expect(screen.getByText('conflict.title')).toBeInTheDocument()
    expect(screen.getByText('conflict.description')).toBeInTheDocument()
  })
})
