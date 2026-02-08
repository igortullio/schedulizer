import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, useNavigate } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as SuccessPage } from './success'

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: vi.fn(),
  }
})

const mockNavigate = vi.fn()

describe('CheckoutSuccessPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(useNavigate).mockReturnValue(mockNavigate)
  })

  function renderWithRouter(initialPath = '/checkout/success') {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <SuccessPage />
      </MemoryRouter>,
    )
  }

  describe('rendering', () => {
    it('renders success heading', () => {
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /payment successful/i })).toBeInTheDocument()
    })

    it('renders thank you message', () => {
      renderWithRouter()
      expect(screen.getByText(/thank you for subscribing/i)).toBeInTheDocument()
    })

    it('renders subscription active message', () => {
      renderWithRouter()
      expect(screen.getByText(/your subscription is now active/i)).toBeInTheDocument()
    })

    it('renders go to dashboard button', () => {
      renderWithRouter()
      expect(screen.getByTestId('go-to-dashboard')).toHaveTextContent('Go to Dashboard')
    })

    it('renders check circle icon', () => {
      renderWithRouter()
      const container = document.querySelector('.bg-green-100')
      expect(container).toBeInTheDocument()
    })
  })

  describe('session id display', () => {
    it('displays session id when present in URL', () => {
      renderWithRouter('/checkout/success?session_id=cs_test_123')
      expect(screen.getByTestId('session-id')).toHaveTextContent('Transaction ID: cs_test_123')
    })

    it('does not display session id when not present', () => {
      renderWithRouter('/checkout/success')
      expect(screen.queryByTestId('session-id')).not.toBeInTheDocument()
    })
  })

  describe('navigation', () => {
    it('navigates to dashboard when button is clicked', async () => {
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

    it('has check icon with aria-hidden', () => {
      renderWithRouter()
      const icon = document.querySelector('[aria-hidden="true"]')
      expect(icon).toBeInTheDocument()
    })
  })
})
