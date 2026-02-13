import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
}))

import type { TimeSlot } from '../hooks/use-slots'
import { DateSlotPicker } from './date-slot-picker'

const mockSlots: TimeSlot[] = [
  { startTime: '2025-01-15T09:00:00Z', endTime: '2025-01-15T09:30:00Z' },
  { startTime: '2025-01-15T10:00:00Z', endTime: '2025-01-15T10:30:00Z' },
]

const defaultProps = {
  slug: 'test-org',
  serviceId: 'srv-1',
  slots: mockSlots,
  slotsState: 'success' as const,
  slotsError: null,
  onFetchSlots: vi.fn(),
  onSelectSlot: vi.fn(),
  onBack: vi.fn(),
}

describe('DateSlotPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders date slot picker', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('date-slot-picker')).toBeInTheDocument()
    expect(screen.getByText('slots.selectDate')).toBeInTheDocument()
    expect(screen.getByText('slots.selectTime')).toBeInTheDocument()
  })

  it('renders slot buttons when slots are available', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('slots-grid')).toBeInTheDocument()
  })

  it('renders back button and calls onBack', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<DateSlotPicker {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByTestId('back-to-services'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows empty state when no slots available', () => {
    render(<DateSlotPicker {...defaultProps} slots={[]} />)
    expect(screen.getByTestId('no-slots')).toBeInTheDocument()
    expect(screen.getByText('slots.empty')).toBeInTheDocument()
  })

  it('shows error state when slotsState is error', () => {
    render(<DateSlotPicker {...defaultProps} slotsState="error" slotsError="Failed to fetch" />)
    expect(screen.getByTestId('slots-error')).toBeInTheDocument()
    expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
  })

  it('calls onSelectSlot when a slot is clicked', async () => {
    const user = userEvent.setup()
    const onSelectSlot = vi.fn()
    render(<DateSlotPicker {...defaultProps} onSelectSlot={onSelectSlot} />)
    const slotButton = screen.getByTestId(`slot-button-${mockSlots[0].startTime}`)
    await user.click(slotButton)
    expect(onSelectSlot).toHaveBeenCalledWith(mockSlots[0])
  })

  it('renders date navigation buttons', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('prev-week')).toBeInTheDocument()
    expect(screen.getByTestId('next-week')).toBeInTheDocument()
  })

  it('disables prev-week button at start offset 0', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('prev-week')).toBeDisabled()
  })

  it('fetches slots on mount with today date', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(defaultProps.onFetchSlots).toHaveBeenCalledWith('test-org', 'srv-1', expect.any(String))
  })
})
