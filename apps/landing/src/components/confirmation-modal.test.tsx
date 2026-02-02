import { describe, expect, it } from 'vitest'
import { ConfirmationModal } from './confirmation-modal'

describe('ConfirmationModal Component', () => {
  it('should be defined', () => {
    expect(ConfirmationModal).toBeDefined()
    expect(typeof ConfirmationModal).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(ConfirmationModal.name).toBe('ConfirmationModal')
  })
})
