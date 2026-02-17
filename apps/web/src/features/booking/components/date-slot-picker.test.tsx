import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
}))

vi.mock('@schedulizer/env/client', () => ({
  clientEnv: { apiUrl: 'http://localhost:3000' },
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

function mockFetchWithSlots() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { slots: mockSlots } }),
  } as Response)
}

function mockFetchNoSlots() {
  vi.spyOn(globalThis, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ data: { slots: [] } }),
  } as Response)
}

describe('DateSlotPicker', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetchWithSlots()
  })

  it('renders date slot picker', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('date-slot-picker')).toBeInTheDocument()
    expect(screen.getByText('slots.selectDate')).toBeInTheDocument()
    expect(screen.getByText('slots.selectTime')).toBeInTheDocument()
  })

  it('renders slot buttons when slots are available', async () => {
    render(<DateSlotPicker {...defaultProps} />)
    await waitFor(() => {
      expect(screen.getByTestId('slots-grid')).toBeInTheDocument()
    })
  })

  it('renders back button and calls onBack', async () => {
    const user = userEvent.setup()
    const onBack = vi.fn()
    render(<DateSlotPicker {...defaultProps} onBack={onBack} />)
    await user.click(screen.getByTestId('back-to-services'))
    expect(onBack).toHaveBeenCalled()
  })

  it('shows error state when slotsState is error', async () => {
    render(<DateSlotPicker {...defaultProps} slotsState="error" slotsError="Failed to fetch" />)
    await waitFor(() => {
      expect(screen.getByTestId('slots-error')).toBeInTheDocument()
      expect(screen.getByText('Failed to fetch')).toBeInTheDocument()
    })
  })

  it('calls onSelectSlot when a slot is clicked', async () => {
    const user = userEvent.setup()
    const onSelectSlot = vi.fn()
    render(<DateSlotPicker {...defaultProps} onSelectSlot={onSelectSlot} />)
    await waitFor(() => {
      expect(screen.getByTestId('slots-grid')).toBeInTheDocument()
    })
    const slotButton = screen.getByTestId(`slot-button-${mockSlots[0].startTime}`)
    await user.click(slotButton)
    expect(onSelectSlot).toHaveBeenCalledWith(mockSlots[0])
  })

  it('renders date navigation buttons', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('prev-week')).toBeInTheDocument()
    expect(screen.getByTestId('next-week')).toBeInTheDocument()
  })

  it('disables prev-week button on first page', () => {
    render(<DateSlotPicker {...defaultProps} />)
    expect(screen.getByTestId('prev-week')).toBeDisabled()
  })

  it('fetches slots on mount', async () => {
    render(<DateSlotPicker {...defaultProps} />)
    await waitFor(() => {
      expect(defaultProps.onFetchSlots).toHaveBeenCalledWith('test-org', 'srv-1', expect.any(String))
    })
  })

  it('shows no dates message when none are available', async () => {
    mockFetchNoSlots()
    render(<DateSlotPicker {...defaultProps} slots={[]} />)
    await waitFor(() => {
      expect(screen.getByText('slots.noDatesAvailable')).toBeInTheDocument()
    })
  })

  it('shows 7 available date buttons after loading', async () => {
    render(<DateSlotPicker {...defaultProps} />)
    await waitFor(() => {
      const dateButtons = screen.getAllByTestId(/^date-button-/)
      expect(dateButtons.length).toBe(7)
    })
  })
})
