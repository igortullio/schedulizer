import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import type { DowngradeValidation } from '../hooks/use-validate-downgrade'
import { DowngradeValidationDialog } from './downgrade-validation-dialog'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (params) {
        let result = key
        for (const [k, v] of Object.entries(params)) {
          result = result.replace(`{{${k}}}`, String(v))
        }
        return result
      }
      return key
    },
    i18n: { language: 'en', changeLanguage: vi.fn() },
    ready: true,
  }),
  Trans: ({ i18nKey }: { i18nKey: string }) => i18nKey,
  initReactI18next: { type: '3rdParty', init: () => {} },
}))

const canDowngradeValidation: DowngradeValidation = {
  canDowngrade: true,
  currentUsage: { members: 1, services: 3 },
  targetLimits: { maxMembers: 1, maxServices: 5 },
}

const cannotDowngradeValidation: DowngradeValidation = {
  canDowngrade: false,
  currentUsage: { members: 3, services: 8 },
  targetLimits: { maxMembers: 1, maxServices: 5 },
  exceeded: [
    { resource: 'members', current: 3, limit: 1 },
    { resource: 'services', current: 8, limit: 5 },
  ],
}

describe('DowngradeValidationDialog', () => {
  describe('when closed', () => {
    it('does not render dialog content', () => {
      render(
        <DowngradeValidationDialog
          isOpen={false}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={null}
          error={null}
        />,
      )
      expect(screen.queryByTestId('downgrade-validation-dialog')).not.toBeInTheDocument()
    })
  })

  describe('when validating', () => {
    it('shows loading state', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={true}
          validation={null}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-validating')).toBeInTheDocument()
    })

    it('does not show confirm button while validating', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={true}
          validation={null}
          error={null}
        />,
      )
      expect(screen.queryByTestId('downgrade-confirm-button')).not.toBeInTheDocument()
    })
  })

  describe('when downgrade is allowed', () => {
    it('shows confirmation message', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={canDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-allowed')).toBeInTheDocument()
    })

    it('shows confirm button', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={canDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-confirm-button')).toBeInTheDocument()
    })

    it('calls onConfirm when confirm button is clicked', async () => {
      const user = userEvent.setup()
      const onConfirm = vi.fn()
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={onConfirm}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={canDowngradeValidation}
          error={null}
        />,
      )
      await user.click(screen.getByTestId('downgrade-confirm-button'))
      expect(onConfirm).toHaveBeenCalled()
    })

    it('calls onClose when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const onClose = vi.fn()
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={onClose}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={canDowngradeValidation}
          error={null}
        />,
      )
      await user.click(screen.getByTestId('downgrade-cancel-button'))
      expect(onClose).toHaveBeenCalled()
    })
  })

  describe('when downgrade is blocked', () => {
    it('shows exceeded resources', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={cannotDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-exceeded')).toBeInTheDocument()
    })

    it('does not show confirm button when blocked', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={cannotDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.queryByTestId('downgrade-confirm-button')).not.toBeInTheDocument()
    })

    it('shows close button when blocked', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={cannotDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-cancel-button')).toBeInTheDocument()
    })
  })

  describe('when error occurs', () => {
    it('shows error message', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={null}
          error="Failed to validate"
        />,
      )
      expect(screen.getByTestId('downgrade-error')).toBeInTheDocument()
    })

    it('shows retry button on error', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={null}
          error="Failed to validate"
        />,
      )
      expect(screen.getByTestId('downgrade-retry-button')).toBeInTheDocument()
    })

    it('calls onRetry when retry button is clicked', async () => {
      const user = userEvent.setup()
      const onRetry = vi.fn()
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={onRetry}
          isLoading={false}
          isValidating={false}
          validation={null}
          error="Failed to validate"
        />,
      )
      await user.click(screen.getByTestId('downgrade-retry-button'))
      expect(onRetry).toHaveBeenCalled()
    })

    it('does not show confirm button on error', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={false}
          isValidating={false}
          validation={null}
          error="Failed to validate"
        />,
      )
      expect(screen.queryByTestId('downgrade-confirm-button')).not.toBeInTheDocument()
    })
  })

  describe('loading state', () => {
    it('disables confirm button when portal is loading', () => {
      render(
        <DowngradeValidationDialog
          isOpen={true}
          onClose={vi.fn()}
          onConfirm={vi.fn()}
          onRetry={vi.fn()}
          isLoading={true}
          isValidating={false}
          validation={canDowngradeValidation}
          error={null}
        />,
      )
      expect(screen.getByTestId('downgrade-confirm-button')).toBeDisabled()
    })
  })
})
