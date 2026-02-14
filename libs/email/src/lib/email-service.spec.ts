import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { EmailService } from './email-service'
import { EMAIL_FROM } from './types'

const mockSend = vi.fn().mockResolvedValue({ data: { id: 'email_123' }, error: null })

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: mockSend }
  },
}))

describe('EmailService', () => {
  const originalEnv = process.env
  let emailService: EmailService

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
    emailService = new EmailService({ apiKey: 'test_api_key' })
    mockSend.mockClear()
  })

  afterEach(() => {
    process.env = originalEnv
  })

  it('should send magic link email in pt-BR', async () => {
    await emailService.sendMagicLink({
      to: 'user@example.com',
      locale: 'pt-BR',
      magicLinkUrl: 'https://app.schedulizer.me/auth/verify?token=abc',
    })
    expect(mockSend).toHaveBeenCalledWith({
      from: EMAIL_FROM,
      to: 'user@example.com',
      subject: 'Seu link de acesso',
      template: {
        id: 'tmpl_magic_pt',
        variables: { magicLinkUrl: 'https://app.schedulizer.me/auth/verify?token=abc' },
      },
    })
  })

  it('should send magic link email in en', async () => {
    await emailService.sendMagicLink({
      to: 'user@example.com',
      locale: 'en',
      magicLinkUrl: 'https://app.schedulizer.me/auth/verify?token=abc',
    })
    expect(mockSend).toHaveBeenCalledWith({
      from: EMAIL_FROM,
      to: 'user@example.com',
      subject: 'Your login link',
      template: {
        id: 'tmpl_magic_en',
        variables: { magicLinkUrl: 'https://app.schedulizer.me/auth/verify?token=abc' },
      },
    })
  })

  it('should send booking confirmation email', async () => {
    await emailService.sendBookingConfirmation({
      to: 'customer@example.com',
      locale: 'pt-BR',
      customerName: 'João Silva',
      serviceName: 'Corte de cabelo',
      appointmentDate: '15/02/2026',
      appointmentTime: '14:00',
      organizationName: 'Barbearia do João',
      cancelUrl: 'https://app.schedulizer.me/manage/abc?action=cancel',
      rescheduleUrl: 'https://app.schedulizer.me/manage/abc?action=reschedule',
    })
    expect(mockSend).toHaveBeenCalledWith({
      from: EMAIL_FROM,
      to: 'customer@example.com',
      subject: 'Reserva confirmada - Barbearia do João',
      template: {
        id: 'tmpl_confirm_pt',
        variables: {
          customerName: 'João Silva',
          serviceName: 'Corte de cabelo',
          appointmentDate: '15/02/2026',
          appointmentTime: '14:00',
          organizationName: 'Barbearia do João',
          cancelUrl: 'https://app.schedulizer.me/manage/abc?action=cancel',
          rescheduleUrl: 'https://app.schedulizer.me/manage/abc?action=reschedule',
        },
      },
    })
  })

  it('should not throw on Resend API error', async () => {
    mockSend.mockResolvedValueOnce({
      data: null,
      error: { message: 'Template not found', name: 'validation_error' },
    })
    await expect(
      emailService.sendMagicLink({
        to: 'user@example.com',
        locale: 'pt-BR',
        magicLinkUrl: 'https://example.com',
      }),
    ).resolves.not.toThrow()
  })

  it('should not throw on unexpected error', async () => {
    mockSend.mockRejectedValueOnce(new Error('Network error'))
    await expect(
      emailService.sendMagicLink({
        to: 'user@example.com',
        locale: 'pt-BR',
        magicLinkUrl: 'https://example.com',
      }),
    ).resolves.not.toThrow()
  })
})
