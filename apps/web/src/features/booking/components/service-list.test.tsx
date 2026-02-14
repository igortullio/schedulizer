import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
}))

import type { BookingService } from '../hooks/use-booking-page'
import { ServiceList } from './service-list'

const mockServices: BookingService[] = [
  { id: 'srv-1', name: 'Haircut', description: 'A professional haircut', durationMinutes: 30, price: '50.00' },
  { id: 'srv-2', name: 'Shave', description: null, durationMinutes: 15, price: null },
  { id: 'srv-3', name: 'Combo', description: 'Haircut + Shave', durationMinutes: 45, price: '75.00' },
]

describe('ServiceList', () => {
  it('renders empty state when no services', () => {
    render(<ServiceList services={[]} onSelect={vi.fn()} />)
    expect(screen.getByTestId('no-services')).toBeInTheDocument()
    expect(screen.getByText('services.empty')).toBeInTheDocument()
  })

  it('renders all services', () => {
    render(<ServiceList services={mockServices} onSelect={vi.fn()} />)
    expect(screen.getByTestId('service-list')).toBeInTheDocument()
    expect(screen.getByText('Haircut')).toBeInTheDocument()
    expect(screen.getByText('Shave')).toBeInTheDocument()
    expect(screen.getByText('Combo')).toBeInTheDocument()
  })

  it('renders service description when present', () => {
    render(<ServiceList services={mockServices} onSelect={vi.fn()} />)
    expect(screen.getByText('A professional haircut')).toBeInTheDocument()
    expect(screen.getByText('Haircut + Shave')).toBeInTheDocument()
  })

  it('renders service duration', () => {
    render(<ServiceList services={mockServices} onSelect={vi.fn()} />)
    expect(screen.getByText(/30/)).toBeInTheDocument()
    expect(screen.getByText(/15/)).toBeInTheDocument()
    expect(screen.getByText(/45/)).toBeInTheDocument()
  })

  it('calls onSelect when a service is clicked', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(<ServiceList services={mockServices} onSelect={onSelect} />)
    await user.click(screen.getByTestId('service-item-srv-1'))
    expect(onSelect).toHaveBeenCalledWith(mockServices[0])
  })

  it('renders each service with correct testid', () => {
    render(<ServiceList services={mockServices} onSelect={vi.fn()} />)
    expect(screen.getByTestId('service-item-srv-1')).toBeInTheDocument()
    expect(screen.getByTestId('service-item-srv-2')).toBeInTheDocument()
    expect(screen.getByTestId('service-item-srv-3')).toBeInTheDocument()
  })
})
