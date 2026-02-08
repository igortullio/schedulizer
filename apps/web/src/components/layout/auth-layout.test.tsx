import { render, screen } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { AuthLayout } from './auth-layout'

function renderAuthLayoutWithRouter(childContent?: string) {
  const router = createMemoryRouter(
    [
      {
        path: '/',
        element: <AuthLayout />,
        children: [
          {
            index: true,
            element: <div data-testid="child-content">{childContent ?? 'Test Child Content'}</div>,
          },
        ],
      },
    ],
    { initialEntries: ['/'] },
  )
  return render(<RouterProvider router={router} />)
}

describe('AuthLayout', () => {
  describe('Component Structure', () => {
    it('should render without crashing', () => {
      renderAuthLayoutWithRouter()
      expect(screen.getByTestId('auth-layout')).toBeInTheDocument()
    })

    it('should render as a defined component', () => {
      expect(AuthLayout).toBeDefined()
      expect(typeof AuthLayout).toBe('function')
    })

    it('should be a valid React component', () => {
      expect(AuthLayout.name).toBe('AuthLayout')
    })
  })

  describe('Logo/Branding', () => {
    it('should display the Schedulizer logo text', () => {
      renderAuthLayoutWithRouter()
      expect(screen.getByTestId('auth-layout-logo-text')).toBeInTheDocument()
      expect(screen.getByTestId('auth-layout-logo-text')).toHaveTextContent('Schedulizer')
    })

    it('should display the calendar icon in the logo', () => {
      renderAuthLayoutWithRouter()
      const logoIcon = screen.getByTestId('auth-layout-logo-icon')
      expect(logoIcon).toBeInTheDocument()
      expect(logoIcon.tagName.toLowerCase()).toBe('svg')
    })

    it('should have aria-hidden attribute on the logo icon', () => {
      renderAuthLayoutWithRouter()
      const logoIcon = screen.getByTestId('auth-layout-logo-icon')
      expect(logoIcon).toHaveAttribute('aria-hidden', 'true')
    })
  })

  describe('Outlet Rendering', () => {
    it('should render child routes via Outlet', () => {
      renderAuthLayoutWithRouter('Login Form Content')
      expect(screen.getByTestId('child-content')).toBeInTheDocument()
      expect(screen.getByText('Login Form Content')).toBeInTheDocument()
    })

    it('should render different child content correctly', () => {
      renderAuthLayoutWithRouter('Verification Page Content')
      expect(screen.getByText('Verification Page Content')).toBeInTheDocument()
    })
  })

  describe('Layout Structure', () => {
    it('should have correct centering classes applied', () => {
      renderAuthLayoutWithRouter()
      const layout = screen.getByTestId('auth-layout')
      expect(layout).toHaveClass('flex')
      expect(layout).toHaveClass('min-h-screen')
      expect(layout).toHaveClass('items-center')
      expect(layout).toHaveClass('justify-center')
    })

    it('should have flex-col class for vertical stacking', () => {
      renderAuthLayoutWithRouter()
      const layout = screen.getByTestId('auth-layout')
      expect(layout).toHaveClass('flex-col')
    })

    it('should have background color class', () => {
      renderAuthLayoutWithRouter()
      const layout = screen.getByTestId('auth-layout')
      expect(layout).toHaveClass('bg-background')
    })

    it('should have responsive padding classes', () => {
      renderAuthLayoutWithRouter()
      const layout = screen.getByTestId('auth-layout')
      expect(layout).toHaveClass('px-4')
      expect(layout).toHaveClass('py-8')
    })
  })

  describe('Accessibility', () => {
    it('should have main element with appropriate role', () => {
      renderAuthLayoutWithRouter()
      const main = screen.getByRole('main')
      expect(main).toBeInTheDocument()
    })

    it('should have aria-label on the main content area', () => {
      renderAuthLayoutWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveAttribute('aria-label', 'Authentication content')
    })

    it('should have max-width constraint on content area', () => {
      renderAuthLayoutWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('max-w-md')
      expect(main).toHaveClass('w-full')
    })
  })

  describe('Responsive Design', () => {
    it('should have full width on mobile with max-width on larger screens', () => {
      renderAuthLayoutWithRouter()
      const main = screen.getByRole('main')
      expect(main).toHaveClass('w-full')
      expect(main).toHaveClass('max-w-md')
    })

    it('should center content with flexbox for all viewport sizes', () => {
      renderAuthLayoutWithRouter()
      const layout = screen.getByTestId('auth-layout')
      expect(layout).toHaveClass('flex')
      expect(layout).toHaveClass('items-center')
      expect(layout).toHaveClass('justify-center')
    })
  })
})
