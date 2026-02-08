import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as CancelPage } from './cancel'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

const mockNavigate = vi.fn()

describe('CheckoutCancelPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  function renderWithRouter() {
    return render(
      <MemoryRouter initialEntries={['/checkout/cancel']}>
        <CancelPage />
      </MemoryRouter>,
    )
  }

  describe('rendering', () => {
    it('renders cancelled heading', () => {
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /payment cancelled/i })).toBeInTheDocument()
    })

    it('renders not completed message', () => {
      renderWithRouter()
      expect(screen.getByText(/your payment was not completed/i)).toBeInTheDocument()
    })

    it('renders no charges message', () => {
      renderWithRouter()
      expect(screen.getByText(/no charges were made/i)).toBeInTheDocument()
    })

    it('renders try again button', () => {
      renderWithRouter()
      expect(screen.getByTestId('try-again')).toHaveTextContent('Try Again')
    })

    it('renders go to dashboard button', () => {
      renderWithRouter()
      expect(screen.getByTestId('go-to-dashboard')).toHaveTextContent('Go to Dashboard')
    })

    it('renders x circle icon', () => {
      renderWithRouter()
      const container = document.querySelector('.bg-red-100')
      expect(container).toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('navigates to pricing when try again is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      await user.click(screen.getByTestId('try-again'))
      expect(mockNavigate).toHaveBeenCalledWith('/pricing', { replace: false })
    })

    it('navigates to dashboard when go to dashboard is clicked', async () => {
      const user = userEvent.setup()
      renderWithRouter()
      await user.click(screen.getByTestId('go-to-dashboard'))
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
    })
  })

  describe('accessibility', () => {
    it('has proper heading hierarchy', () => {
      renderWithRouter()
      const heading = screen.getByRole('heading', { level: 3 })
      expect(heading).toBeInTheDocument()
    })

    it('has x icon with aria-hidden', () => {
      renderWithRouter()
      const icon = document.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})
