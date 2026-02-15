import { describe, expect, it } from 'vitest'
import { TemplateRegistry } from './template-registry'
import { EmailType } from './types'

describe('TemplateRegistry', () => {
  it('should return correct template ID for MagicLink pt-BR', () => {
    const registry = new TemplateRegistry()
    expect(registry.getTemplateId(EmailType.MagicLink, 'pt-BR')).toBe('magic-link_pt-br')
  })

  it('should return correct template ID for BookingConfirmation en', () => {
    const registry = new TemplateRegistry()
    expect(registry.getTemplateId(EmailType.BookingConfirmation, 'en')).toBe('booking-confirmation_en')
  })

  it('should return correct template ID for OwnerReschedule pt-BR', () => {
    const registry = new TemplateRegistry()
    expect(registry.getTemplateId(EmailType.OwnerReschedule, 'pt-BR')).toBe('owner-reschedule_pt-br')
  })
})
