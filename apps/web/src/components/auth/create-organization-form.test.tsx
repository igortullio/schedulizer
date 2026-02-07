import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { CreateOrganizationForm } from './create-organization-form'

vi.mock('@/lib/auth-client', () => ({
  authClient: {
    organization: {
      setActive: vi.fn(),
      create: vi.fn(),
    },
  },
}))

import { authClient } from '@/lib/auth-client'

const mockSetActive = vi.mocked(authClient.organization.setActive)
const mockCreate = vi.mocked(authClient.organization.create)

const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  }
})

function renderForm() {
  return render(
    <MemoryRouter>
      <CreateOrganizationForm />
    </MemoryRouter>,
  )
}

describe('CreateOrganizationForm', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the creation form', () => {
    renderForm()
    expect(screen.getByTestId('org-create-form')).toBeInTheDocument()
    expect(screen.getByText('Create your organization')).toBeInTheDocument()
    expect(screen.getByText('Get started by creating your first organization')).toBeInTheDocument()
  })

  it('shows organization name input', () => {
    renderForm()
    expect(screen.getByTestId('org-name-input')).toBeInTheDocument()
    expect(screen.getByLabelText('Organization name')).toBeInTheDocument()
  })

  it('shows create organization button', () => {
    renderForm()
    expect(screen.getByTestId('org-create-button')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create organization/i })).toBeInTheDocument()
  })

  it('shows validation error for empty name', async () => {
    const user = userEvent.setup()
    renderForm()
    await user.click(screen.getByTestId('org-create-button'))
    await waitFor(() => {
      expect(screen.getByTestId('org-name-error')).toBeInTheDocument()
    })
    expect(screen.getByTestId('org-name-error')).toHaveTextContent('Organization name is required')
  })

  it('shows validation error for name shorter than 2 characters', async () => {
    const user = userEvent.setup()
    renderForm()
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
    renderForm()
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
    renderForm()
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
    renderForm()
    await user.type(screen.getByTestId('org-name-input'), 'My Business')
    await user.click(screen.getByTestId('org-create-button'))
    expect(screen.getByText('Creating organization…')).toBeInTheDocument()
    expect(screen.getByTestId('org-create-button')).toBeDisabled()
  })

  it('shows error when slug is already taken', async () => {
    const user = userEvent.setup()
    mockCreate.mockResolvedValueOnce({
      data: null,
      error: { code: 'ORGANIZATION_SLUG_ALREADY_TAKEN', message: 'Slug taken', status: 409 },
    })
    renderForm()
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
    renderForm()
    await user.type(screen.getByTestId('org-name-input'), 'My Business')
    await user.click(screen.getByTestId('org-create-button'))
    await waitFor(() => {
      expect(screen.getByTestId('org-create-error')).toBeInTheDocument()
    })
    expect(screen.getByTestId('org-create-error')).toHaveTextContent('Failed to create organization. Please try again.')
  })

  it('shows error when network error occurs', async () => {
    const user = userEvent.setup()
    mockCreate.mockRejectedValueOnce(new Error('Network error'))
    renderForm()
    await user.type(screen.getByTestId('org-name-input'), 'My Business')
    await user.click(screen.getByTestId('org-create-button'))
    await waitFor(() => {
      expect(screen.getByTestId('org-create-error')).toBeInTheDocument()
    })
    expect(screen.getByTestId('org-create-error')).toHaveTextContent('An unexpected error occurred. Please try again.')
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
    renderForm()
    await user.type(screen.getByTestId('org-name-input'), 'My Business')
    await user.click(screen.getByTestId('org-create-button'))
    await waitFor(() => {
      expect(mockSetActive).toHaveBeenCalledWith({ organizationId: 'new-org-1' })
    })
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('has proper heading structure', () => {
    renderForm()
    expect(screen.getByRole('heading', { name: /create your organization/i })).toBeInTheDocument()
  })
})
