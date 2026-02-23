import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as OrgSelectPage } from './org-select'

vi.mock('react-i18next', () => {
  const t = (key: string) => key
  const i18n = {
    changeLanguage: vi.fn(() => Promise.resolve()),
    language: 'pt-BR',
  }
  return {
    useTranslation: () => ({ t, i18n, ready: true }),
  }
})

vi.mock('@/components/auth/create-organization-form', () => ({
  CreateOrganizationForm: ({ redirect }: { redirect?: string | null }) => (
    <div data-testid="org-create-form" data-redirect={redirect ?? ''}>
      Create Organization Form
    </div>
  ),
}))

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useListOrganizations: vi.fn(),
    organization: {
      setActive: vi.fn(),
    },
  },
  signOut: vi.fn(),
}))

import { authClient, signOut } from '@/lib/auth-client'

const mockUseListOrganizations = vi.mocked(authClient.useListOrganizations)
const mockSetActive = vi.mocked(authClient.organization.setActive)
const mockSignOut = vi.mocked(signOut)

function mockOrgList(value: { data?: unknown; isPending?: boolean; error?: unknown }) {
  mockUseListOrganizations.mockReturnValue({
    data: null,
    isPending: false,
    error: null,
    isRefetching: false,
    refetch: vi.fn(),
    ...value,
  } as ReturnType<typeof authClient.useListOrganizations>)
}

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderWithRouter() {
  return render(
    <MemoryRouter initialEntries={['/auth/org-select']}>
      <Routes>
        <Route path="/auth/org-select" element={<OrgSelectPage />} />
        <Route path="/auth/login" element={<div data-testid="login-page">Login Page</div>} />
        <Route path="/" element={<div data-testid="dashboard-page">Dashboard Page</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

function renderWithRedirect(redirect: string) {
  return render(
    <MemoryRouter initialEntries={[`/auth/org-select?redirect=${encodeURIComponent(redirect)}`]}>
      <Routes>
        <Route path="/auth/org-select" element={<OrgSelectPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

const mockOrganizations = [
  { id: 'org-1', name: 'Organization One', slug: 'org-one', createdAt: new Date(), logo: null },
  {
    id: 'org-2',
    name: 'Organization Two',
    slug: 'org-two',
    createdAt: new Date(),
    logo: 'https://example.com/logo.png',
  },
]

describe('OrgSelectPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockOrgList({
      data: null,
      isPending: true,
      error: null,
    })
  })

  describe('loading state', () => {
    it('renders loading state while fetching organizations', () => {
      mockOrgList({
        data: null,
        isPending: true,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByTestId('org-select-loading')).toBeInTheDocument()
      expect(screen.getByText('orgSelect.loadingOrganizations')).toBeInTheDocument()
      expect(screen.getByText('orgSelect.pleaseWaitLoading')).toBeInTheDocument()
    })

    it('shows loading spinner animation', () => {
      mockOrgList({
        data: null,
        isPending: true,
        error: null,
      })
      renderWithRouter()
      const spinner = screen.getByTestId('org-select-loading').querySelector('svg')
      expect(spinner).toHaveClass('animate-spin')
    })
  })

  describe('organization list', () => {
    it('displays list of organizations when user has multiple organizations', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByTestId('org-select-list')).toBeInTheDocument()
      expect(screen.getByText('Organization One')).toBeInTheDocument()
      expect(screen.getByText('Organization Two')).toBeInTheDocument()
    })

    it('shows organization name for each organization', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByText('Organization One')).toBeInTheDocument()
      expect(screen.getByText('Organization Two')).toBeInTheDocument()
    })

    it('displays organization items with correct test ids', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByTestId('org-item-org-1')).toBeInTheDocument()
      expect(screen.getByTestId('org-item-org-2')).toBeInTheDocument()
    })

    it('shows organization logo when available', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      const orgWithLogo = screen.getByTestId('org-item-org-2')
      const logoImg = orgWithLogo.querySelector('img')
      expect(logoImg).toBeInTheDocument()
      expect(logoImg).toHaveAttribute('src', 'https://example.com/logo.png')
    })

    it('shows building icon when organization has no logo', () => {
      mockOrgList({
        data: [mockOrganizations[0]],
        isPending: false,
        error: null,
      })
      renderWithRouter()
      const orgWithoutLogo = screen.getByTestId('org-item-org-1')
      const buildingIcon = orgWithoutLogo.querySelector('svg')
      expect(buildingIcon).toBeInTheDocument()
    })
  })

  describe('auto-selection', () => {
    it('auto-selects and redirects when user has single organization', async () => {
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: [mockOrganizations[0]],
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('auto-selects and redirects to redirect param when present', async () => {
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: [mockOrganizations[0]],
        isPending: false,
        error: null,
      })
      renderWithRedirect('/pricing')
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/pricing', { replace: true })
      })
    })

    it('does not auto-select when user has multiple organizations', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(mockSetActive).not.toHaveBeenCalled()
      expect(mockNavigate).not.toHaveBeenCalled()
    })

    it('does not auto-select when organizations are still loading', () => {
      mockOrgList({
        data: null,
        isPending: true,
        error: null,
      })
      renderWithRouter()
      expect(mockSetActive).not.toHaveBeenCalled()
    })
  })

  describe('organization selection', () => {
    it('calls setActive with correct organizationId on selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
    })

    it('redirects to dashboard after successful selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('redirects to redirect param after successful selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRedirect('/pricing')
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/pricing', { replace: true })
      })
    })

    it('shows loading spinner on selected organization during selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100)),
      )
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      const orgItem = screen.getByTestId('org-item-org-1')
      const spinner = orgItem.querySelector('.animate-spin')
      expect(spinner).toBeInTheDocument()
    })

    it('disables all organization buttons during selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100)),
      )
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      expect(screen.getByTestId('org-item-org-1')).toBeDisabled()
      expect(screen.getByTestId('org-item-org-2')).toBeDisabled()
    })
  })

  describe('error handling - fetch', () => {
    it('displays error message when organization fetch fails', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Failed to fetch organizations' },
      })
      renderWithRouter()
      expect(screen.getByTestId('org-select-fetch-error')).toBeInTheDocument()
      expect(screen.getByText('orgSelect.failedToLoad')).toBeInTheDocument()
      expect(screen.getByTestId('org-select-fetch-error-message')).toHaveTextContent('Failed to fetch organizations')
    })

    it('shows try again button on fetch error', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Network error' },
      })
      renderWithRouter()
      expect(screen.getByRole('button', { name: 'orgSelect.tryAgain' })).toBeInTheDocument()
    })

    it('fetch error has role alert', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Error' },
      })
      renderWithRouter()
      expect(screen.getByTestId('org-select-fetch-error')).toHaveAttribute('role', 'alert')
    })
  })

  describe('error handling - selection', () => {
    it('displays error message when organization selection fails', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'SELECTION_FAILED', message: 'Selection failed', status: 500 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent('orgSelect.errors.failedToSelect')
    })

    it('displays permission error message for 403 status', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'FORBIDDEN', message: 'Forbidden', status: 403 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent('orgSelect.errors.noPermission')
    })

    it('displays not found error message for 404 status', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'NOT_FOUND', message: 'Not found', status: 404 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent('orgSelect.errors.notFound')
    })

    it('handles network error during selection', async () => {
      const user = userEvent.setup()
      mockSetActive.mockRejectedValueOnce(new Error('Network error'))
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent('orgSelect.errors.unexpectedError')
    })

    it('shows retry button on selection error', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Error', status: 500 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByRole('button', { name: 'orgSelect.retry' })).toBeInTheDocument()
    })

    it('retries selection when clicking retry button', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Error', status: 500 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      await user.click(screen.getByRole('button', { name: 'orgSelect.retry' }))
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledTimes(2)
      })
      expect(mockSetActive).toHaveBeenLastCalledWith({ organizationId: 'org-1' })
    })
  })

  describe('organization creation', () => {
    it('shows creation form when user has no organizations', () => {
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      expect(screen.getByTestId('org-create-form')).toBeInTheDocument()
    })

    it('passes redirect prop to CreateOrganizationForm', () => {
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRedirect('/pricing')
      expect(screen.getByTestId('org-create-form')).toHaveAttribute('data-redirect', '/pricing')
    })

    it('shows creation form when data is null and not pending', () => {
      mockOrgList({ data: null, isPending: false, error: null })
      renderWithRouter()
      expect(screen.getByTestId('org-create-form')).toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('organization list has proper aria-label', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      const list = screen.getByLabelText(/organizations/i)
      expect(list).toBeInTheDocument()
      expect(list.tagName).toBe('UL')
    })

    it('loading state has proper heading structure', () => {
      mockOrgList({
        data: null,
        isPending: true,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: 'orgSelect.loadingOrganizations' })).toBeInTheDocument()
    })

    it('list state has proper heading structure', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: 'orgSelect.selectAnOrganization' })).toBeInTheDocument()
    })

    it('error state has proper heading structure', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Error' },
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: 'orgSelect.failedToLoad' })).toBeInTheDocument()
    })

    it('selection error has role alert', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Error', status: 500 },
      })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      await waitFor(() => {
        expect(screen.getByTestId('org-select-selection-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-select-selection-error')).toHaveAttribute('role', 'alert')
    })

    it('icons have aria-hidden attribute', () => {
      mockOrgList({
        data: null,
        isPending: true,
        error: null,
      })
      renderWithRouter()
      const icons = screen.getByTestId('org-select-loading').querySelectorAll('svg')
      icons.forEach(icon => {
        expect(icon).toHaveAttribute('aria-hidden', 'true')
      })
    })

    it('organization button has aria-busy when selecting', async () => {
      const user = userEvent.setup()
      mockSetActive.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: {}, error: null }), 100)),
      )
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await user.click(screen.getByTestId('org-item-org-1'))
      expect(screen.getByTestId('org-item-org-1')).toHaveAttribute('aria-busy', 'true')
    })
  })

  describe('sign out', () => {
    it('renders sign-out button and calls signOut on click', async () => {
      const user = userEvent.setup()
      mockSignOut.mockResolvedValueOnce(undefined)
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      const signOutBtn = screen.getByTestId('sign-out-button')
      expect(signOutBtn).toBeInTheDocument()
      await user.click(signOutBtn)
      expect(mockSignOut).toHaveBeenCalled()
    })
  })

  describe('integration', () => {
    it('full flow from page load to organization selection to redirect', async () => {
      const user = userEvent.setup()
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByTestId('org-select-list')).toBeInTheDocument()
      expect(screen.getByText('Organization One')).toBeInTheDocument()
      expect(screen.getByText('Organization Two')).toBeInTheDocument()
      await user.click(screen.getByTestId('org-item-org-2'))
      expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-2' })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })

    it('auto-selection flow for single-organization user', async () => {
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({
        data: [mockOrganizations[0]],
        isPending: false,
        error: null,
      })
      renderWithRouter()
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'org-1' })
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/dashboard', { replace: true })
      })
    })
  })
})
