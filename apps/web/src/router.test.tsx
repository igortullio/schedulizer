import { render, screen, waitFor } from '@testing-library/react'
import { createMemoryRouter, RouterProvider } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/layout/auth-layout', () => ({
  AuthLayout: () => (
    <div data-testid="auth-layout">
      <div data-testid="auth-layout-outlet" />
    </div>
  ),
}))

vi.mock('@/routes/auth/login', () => ({
  Component: () => <div data-testid="login-page">Login Page</div>,
}))

vi.mock('@/routes/auth/verify', () => ({
  Component: () => <div data-testid="verify-page">Verify Page</div>,
}))

vi.mock('@/routes/auth/org-select', () => ({
  Component: () => <div data-testid="org-select-page">Org Select Page</div>,
}))

describe('Router Configuration', () => {
  describe('Route Structure', () => {
    it('should have auth routes defined', async () => {
      const { router } = await import('./router')
      expect(router).toBeDefined()
      expect(router.routes).toBeDefined()
      expect(router.routes.length).toBeGreaterThan(0)
    })

    it('should have /auth as parent route', async () => {
      const { router } = await import('./router')
      const authRoute = router.routes.find(route => route.path === '/auth')
      expect(authRoute).toBeDefined()
    })

    it('should have login, verify, and org-select as child routes', async () => {
      const { router } = await import('./router')
      const authRoute = router.routes.find(route => route.path === '/auth')
      expect(authRoute?.children).toBeDefined()
      const childPaths = authRoute?.children?.map(child => child.path)
      expect(childPaths).toContain('login')
      expect(childPaths).toContain('verify')
      expect(childPaths).toContain('org-select')
    })
  })

  describe('Route Rendering', () => {
    it('should render AuthLayout on /auth path', async () => {
      const { router } = await import('./router')
      const testRouter = createMemoryRouter(router.routes, {
        initialEntries: ['/auth'],
      })
      render(<RouterProvider router={testRouter} />)
      await waitFor(() => {
        expect(screen.getByTestId('auth-layout')).toBeInTheDocument()
      })
    })
  })
})
