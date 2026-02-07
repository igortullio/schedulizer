import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Component as OrgSelectPage } from './org-select'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    useListOrganizations: vi.fn(),
    organization: {
      setActive: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { authClient } from '@/lib/auth-client'

const mockUseListOrganizations = vi.mocked(authClient.useListOrganizations)
const mockSetActive = vi.mocked(authClient.organization.setActive)
const mockCreate = vi.mocked(authClient.organization.create)

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
      expect(screen.getByText('Loading organizations')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we load your organizations...')).toBeInTheDocument()
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
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
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
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
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
      expect(screen.getByText('Failed to load organizations')).toBeInTheDocument()
      expect(screen.getByTestId('org-select-fetch-error-message')).toHaveTextContent('Failed to fetch organizations')
    })

    it('shows try again button on fetch error', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Network error' },
      })
      renderWithRouter()
      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument()
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
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent(
        'Failed to select organization. Please try again.',
      )
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
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent(
        'You do not have permission to access this organization.',
      )
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
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent('Organization not found.')
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
      expect(screen.getByTestId('org-select-selection-error')).toHaveTextContent(
        'An unexpected error occurred. Please try again.',
      )
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
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
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
      await user.click(screen.getByRole('button', { name: /retry/i }))
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
      expect(screen.getByText('Create your organization')).toBeInTheDocument()
      expect(screen.getByText('Get started by creating your first organization')).toBeInTheDocument()
    })

    it('shows creation form when data is null and not pending', () => {
      mockOrgList({ data: null, isPending: false, error: null })
      renderWithRouter()
      expect(screen.getByTestId('org-create-form')).toBeInTheDocument()
    })

    it('shows organization name input', () => {
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      expect(screen.getByTestId('org-name-input')).toBeInTheDocument()
      expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
    })

    it('shows create organization button', () => {
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      expect(screen.getByTestId('org-create-button')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
    })

    it('shows validation error for empty name', async () => {
      const user = userEvent.setup()
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(screen.getByTestId('org-name-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-name-error')).toHaveTextContent('Organization name is required')
    })

    it('shows validation error for name shorter than 2 characters', async () => {
      const user = userEvent.setup()
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'A')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(screen.getByTestId('org-name-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-name-error')).toHaveTextContent('Name must be at least 2 characters')
    })

    it('calls organization.create with name and generated slug', async () => {
      const user = userEvent.setup()
      mockCreate.mockResolvedValueOnce({
        data: { id: 'new-org-1', name: 'My Business', slug: 'my-business' },
        error: null,
      })
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(mockCreate).toHaveBeenCalledWith({ name: 'My Business', slug: 'my-business' })
      })
    })

    it('calls setActive and navigates to dashboard after successful creation', async () => {
      const user = userEvent.setup()
      mockCreate.mockResolvedValueOnce({
        data: { id: 'new-org-1', name: 'My Business', slug: 'my-business' },
        error: null,
      })
      mockSetActive.mockResolvedValueOnce({ data: {}, error: null })
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'new-org-1' })
      })
      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
      })
    })

    it('shows loading state during creation', async () => {
      const user = userEvent.setup()
      mockCreate.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ data: { id: 'new-org-1' }, error: null }), 100)),
      )
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      expect(screen.getByText('Creating organization...')).toBeInTheDocument()
      expect(screen.getByTestId('org-create-button')).toBeDisabled()
    })

    it('shows error when slug is already taken', async () => {
      const user = userEvent.setup()
      mockCreate.mockResolvedValueOnce({
        data: null,
        error: { code: 'ORGANIZATION_SLUG_ALREADY_TAKEN', message: 'Slug taken', status: 409 },
      })
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(screen.getByTestId('org-create-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-create-error')).toHaveTextContent(
        'An organization with a similar name already exists. Please choose a different name.',
      )
    })

    it('shows error when creation fails with generic error', async () => {
      const user = userEvent.setup()
      mockCreate.mockResolvedValueOnce({
        data: null,
        error: { code: 'INTERNAL_ERROR', message: 'Server error', status: 500 },
      })
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(screen.getByTestId('org-create-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-create-error')).toHaveTextContent(
        'Failed to create organization. Please try again.',
      )
    })

    it('shows error when network error occurs', async () => {
      const user = userEvent.setup()
      mockCreate.mockRejectedValueOnce(new Error('Network error'))
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(screen.getByTestId('org-create-error')).toBeInTheDocument()
      })
      expect(screen.getByTestId('org-create-error')).toHaveTextContent(
        'An unexpected error occurred. Please try again.',
      )
    })

    it('does not navigate when setActive fails after creation', async () => {
      const user = userEvent.setup()
      mockCreate.mockResolvedValueOnce({
        data: { id: 'new-org-1', name: 'My Business', slug: 'my-business' },
        error: null,
      })
      mockSetActive.mockResolvedValueOnce({
        data: null,
        error: { code: 'ERROR', message: 'Failed', status: 500 },
      })
      mockOrgList({ data: [], isPending: false, error: null })
      renderWithRouter()
      await user.type(screen.getByTestId('org-name-input'), 'My Business')
      await user.click(screen.getByTestId('org-create-button'))
      await waitFor(() => {
        expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'new-org-1' })
      })
      expect(mockNavigate).not.toHaveBeenCalled()
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
      expect(screen.getByRole('heading', { name: /loading organizations/i })).toBeInTheDocument()
    })

    it('list state has proper heading structure', () => {
      mockOrgList({
        data: mockOrganizations,
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /select an organization/i })).toBeInTheDocument()
    })

    it('creation form has proper heading structure', () => {
      mockOrgList({
        data: [],
        isPending: false,
        error: null,
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /create your organization/i })).toBeInTheDocument()
    })

    it('error state has proper heading structure', () => {
      mockOrgList({
        data: null,
        isPending: false,
        error: { message: 'Error' },
      })
      renderWithRouter()
      expect(screen.getByRole('heading', { name: /failed to load organizations/i })).toBeInTheDocument()
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
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
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
        expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true })
      })
    })
  })
})
