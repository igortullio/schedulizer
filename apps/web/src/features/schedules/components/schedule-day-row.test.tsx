import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ScheduleDayRow } from './schedule-day-row'

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
  dayOfWeek: 1,
  isActive: true,
  periods: [{ startTime: '09:00', endTime: '12:00' }],
  onToggleActive: vi.fn(),
  onPeriodsChange: vi.fn(),
}

describe('ScheduleDayRow', () => {
  it('renders the day row container', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByTestId('schedule-day-1')).toBeInTheDocument()
  })

  it('renders day name using translation key', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByText('days.monday')).toBeInTheDocument()
  })

  it('renders day toggle switch', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByTestId('day-toggle-1')).toBeInTheDocument()
  })

  it('renders period inputs when active', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByTestId('period-start-1-0')).toHaveValue('09:00')
    expect(screen.getByTestId('period-end-1-0')).toHaveValue('12:00')
  })

  it('renders day off message when inactive', () => {
    render(<ScheduleDayRow {...defaultProps} isActive={false} />)
    expect(screen.getByText('dayOff')).toBeInTheDocument()
  })

  it('does not render period inputs when inactive', () => {
    render(<ScheduleDayRow {...defaultProps} isActive={false} />)
    expect(screen.queryByTestId('period-start-1-0')).not.toBeInTheDocument()
  })

  it('renders add period button when active', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByTestId('add-period-1')).toBeInTheDocument()
  })

  it('renders remove period button for each period', () => {
    render(<ScheduleDayRow {...defaultProps} />)
    expect(screen.getByTestId('remove-period-1-0')).toBeInTheDocument()
  })

  it('calls onPeriodsChange when add period is clicked', async () => {
    const user = userEvent.setup()
    const onPeriodsChange = vi.fn()
    render(<ScheduleDayRow {...defaultProps} onPeriodsChange={onPeriodsChange} />)
    await user.click(screen.getByTestId('add-period-1'))
    expect(onPeriodsChange).toHaveBeenCalledWith(1, [
      { startTime: '09:00', endTime: '12:00' },
      { startTime: '09:00', endTime: '18:00' },
    ])
  })

  it('calls onPeriodsChange when remove period is clicked', async () => {
    const user = userEvent.setup()
    const onPeriodsChange = vi.fn()
    render(<ScheduleDayRow {...defaultProps} onPeriodsChange={onPeriodsChange} />)
    await user.click(screen.getByTestId('remove-period-1-0'))
    expect(onPeriodsChange).toHaveBeenCalledWith(1, [])
  })

  it('renders multiple periods correctly', () => {
    const periods = [
      { startTime: '08:00', endTime: '12:00' },
      { startTime: '14:00', endTime: '18:00' },
    ]
    render(<ScheduleDayRow {...defaultProps} periods={periods} />)
    expect(screen.getByTestId('period-start-1-0')).toHaveValue('08:00')
    expect(screen.getByTestId('period-end-1-0')).toHaveValue('12:00')
    expect(screen.getByTestId('period-start-1-1')).toHaveValue('14:00')
    expect(screen.getByTestId('period-end-1-1')).toHaveValue('18:00')
  })

  it('renders sunday correctly with dayOfWeek 0', () => {
    render(<ScheduleDayRow {...defaultProps} dayOfWeek={0} />)
    expect(screen.getByText('days.sunday')).toBeInTheDocument()
  })
})
