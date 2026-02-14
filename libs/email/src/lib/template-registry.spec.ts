import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { TemplateRegistry } from './template-registry'
import { EmailType } from './types'

describe('TemplateRegistry', () => {
  const originalEnv = process.env

  beforeEach(() => {
    process.env = { ...originalEnv }
    process.env.RESEND_TPL_MAGIC_LINK_PT_BR = 'tmpl_magic_pt'
    process.env.RESEND_TPL_MAGIC_LINK_EN = 'tmpl_magic_en'
    process.env.RESEND_TPL_BOOKING_CONFIRMATION_PT_BR = 'tmpl_confirm_pt'
    process.env.RESEND_TPL_BOOKING_CONFIRMATION_EN = 'tmpl_confirm_en'
    process.env.RESEND_TPL_BOOKING_CANCELLATION_PT_BR = 'tmpl_cancel_pt'
    process.env.RESEND_TPL_BOOKING_CANCELLATION_EN = 'tmpl_cancel_en'
    process.env.RESEND_TPL_BOOKING_RESCHEDULE_PT_BR = 'tmpl_reschedule_pt'
    process.env.RESEND_TPL_BOOKING_RESCHEDULE_EN = 'tmpl_reschedule_en'
    process.env.RESEND_TPL_APPOINTMENT_REMINDER_PT_BR = 'tmpl_reminder_pt'
    process.env.RESEND_TPL_APPOINTMENT_REMINDER_EN = 'tmpl_reminder_en'
    process.env.RESEND_TPL_OWNER_NEW_BOOKING_PT_BR = 'tmpl_owner_new_pt'
    process.env.RESEND_TPL_OWNER_NEW_BOOKING_EN = 'tmpl_owner_new_en'
    process.env.RESEND_TPL_OWNER_CANCELLATION_PT_BR = 'tmpl_owner_cancel_pt'
    process.env.RESEND_TPL_OWNER_CANCELLATION_EN = 'tmpl_owner_cancel_en'
    process.env.RESEND_TPL_OWNER_RESCHEDULE_PT_BR = 'tmpl_owner_reschedule_pt'
    process.env.RESEND_TPL_OWNER_RESCHEDULE_EN = 'tmpl_owner_reschedule_en'
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should return correct template ID for MagicLink pt-BR', () => {
    const registry = new TemplateRegistry()
    expect(registry.getTemplateId(EmailType.MagicLink, 'pt-BR')).toBe('tmpl_magic_pt')
  })

  it('should return correct template ID for BookingConfirmation en', () => {
    const registry = new TemplateRegistry()
    expect(registry.getTemplateId(EmailType.BookingConfirmation, 'en')).toBe('tmpl_confirm_en')
  })

  it('should throw when template ID is not configured', () => {
    process.env.RESEND_TPL_MAGIC_LINK_PT_BR = ''
    const registry = new TemplateRegistry()
    expect(() => registry.getTemplateId(EmailType.MagicLink, 'pt-BR')).toThrow(
      'Template ID not configured for magic-link (pt-BR)',
    )
  })

  it('should validate all template IDs and return missing ones', () => {
    process.env.RESEND_TPL_MAGIC_LINK_EN = ''
    process.env.RESEND_TPL_OWNER_RESCHEDULE_PT_BR = ''
    const registry = new TemplateRegistry()
    const missing = registry.validateAllTemplateIds()
    expect(missing).toContain('magic-link (en)')
    expect(missing).toContain('owner-reschedule (pt-BR)')
    expect(missing).toHaveLength(2)
  })

  it('should return empty array when all template IDs are configured', () => {
    const registry = new TemplateRegistry()
    const missing = registry.validateAllTemplateIds()
    expect(missing).toHaveLength(0)
  })
})
