import { beforeEach, describe, expect, it, type Mock, vi } from 'vitest'
import { ChannelResolver } from './channel-resolver'
import { NotificationService } from './notification-service'

describe('NotificationService', () => {
  let service: NotificationService
  let mockWhatsAppService: { sendTemplate: Mock }
  let mockEmailService: {
    sendBookingConfirmation: Mock
    sendBookingCancellation: Mock
    sendBookingReschedule: Mock
    sendAppointmentReminder: Mock
  }
  let channelResolver: ChannelResolver

  beforeEach(() => {
    mockWhatsAppService = {
      sendTemplate: vi.fn().mockResolvedValue({ messageId: 'wamid.123', success: true }),
    }
    mockEmailService = {
      sendBookingConfirmation: vi.fn().mockResolvedValue(undefined),
      sendBookingCancellation: vi.fn().mockResolvedValue(undefined),
      sendBookingReschedule: vi.fn().mockResolvedValue(undefined),
      sendAppointmentReminder: vi.fn().mockResolvedValue(undefined),
    }
    channelResolver = new ChannelResolver()
    service = new NotificationService({
      channelResolver,
      whatsAppService: mockWhatsAppService as never,
      emailService: mockEmailService as never,
    })
  })

  const baseData = {
    customerName: 'João',
    serviceName: 'Corte de Cabelo',
    appointmentDate: '20/02/2026',
    appointmentTime: '14:00',
    organizationName: 'Barbearia Legal',
    cancelUrl: 'https://example.com/cancel',
    rescheduleUrl: 'https://example.com/reschedule',
  }

  it('should route to whatsapp when channel resolves to whatsapp', () => {
    service.send({
      event: 'appointment.confirmed',
      organizationId: 'org-1',
      recipientPhone: '+5511999999999',
      recipientEmail: 'test@example.com',
      locale: 'pt-BR',
      data: baseData,

      planType: 'professional',
    })
    expect(mockWhatsAppService.sendTemplate).toHaveBeenCalledWith({
      to: '+5511999999999',
      templateName: 'appointment_confirmation',
      languageCode: 'pt_BR',
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'João' },
            { type: 'text', text: 'Barbearia Legal' },
            { type: 'text', text: 'Corte de Cabelo' },
            { type: 'text', text: '20/02/2026 14:00' },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: '' }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 1,
          parameters: [{ type: 'text', text: '' }],
        },
      ],
    })
  })

  it('should route to email when channel resolves to email', () => {
    service.send({
      event: 'appointment.confirmed',
      organizationId: 'org-1',
      recipientEmail: 'test@example.com',
      locale: 'pt-BR',
      data: baseData,

      planType: 'essential',
    })
    expect(mockEmailService.sendBookingConfirmation).toHaveBeenCalledWith({
      to: 'test@example.com',
      locale: 'pt-BR',
      customerName: 'João',
      serviceName: 'Corte de Cabelo',
      appointmentDate: '20/02/2026',
      appointmentTime: '14:00',
      organizationName: 'Barbearia Legal',
      cancelUrl: 'https://example.com/cancel',
      rescheduleUrl: 'https://example.com/reschedule',
    })
  })

  it('should call sendBookingCancellation for cancelled event via email', () => {
    service.send({
      event: 'appointment.cancelled',
      organizationId: 'org-1',
      recipientEmail: 'test@example.com',
      locale: 'pt-BR',
      data: baseData,

      planType: 'essential',
    })
    expect(mockEmailService.sendBookingCancellation).toHaveBeenCalled()
  })

  it('should call sendBookingReschedule for rescheduled event via email', () => {
    service.send({
      event: 'appointment.rescheduled',
      organizationId: 'org-1',
      recipientEmail: 'test@example.com',
      locale: 'pt-BR',
      data: { ...baseData, oldDate: '19/02/2026', oldTime: '10:00', newDate: '20/02/2026', newTime: '14:00' },

      planType: 'essential',
    })
    expect(mockEmailService.sendBookingReschedule).toHaveBeenCalled()
  })

  it('should call sendAppointmentReminder for reminder event via email', () => {
    service.send({
      event: 'appointment.reminder',
      organizationId: 'org-1',
      recipientEmail: 'test@example.com',
      locale: 'pt-BR',
      data: baseData,

      planType: 'essential',
    })
    expect(mockEmailService.sendAppointmentReminder).toHaveBeenCalled()
  })

  it('should use en_US language code for en locale via whatsapp', () => {
    service.send({
      event: 'appointment.confirmed',
      organizationId: 'org-1',
      recipientPhone: '+5511999999999',
      locale: 'en',
      data: baseData,

      planType: 'professional',
    })
    expect(mockWhatsAppService.sendTemplate).toHaveBeenCalledWith(expect.objectContaining({ languageCode: 'en_US' }))
  })

  it('should log error when email notification has no recipientEmail', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    service.send({
      event: 'appointment.confirmed',
      organizationId: 'org-1',
      locale: 'pt-BR',
      data: baseData,

      planType: 'essential',
    })
    expect(mockEmailService.sendBookingConfirmation).not.toHaveBeenCalled()
    errorSpy.mockRestore()
  })

  it('should not throw when WhatsAppService fails (fire-and-forget)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockWhatsAppService.sendTemplate.mockRejectedValueOnce(new Error('API timeout'))
    expect(() => {
      service.send({
        event: 'appointment.confirmed',
        organizationId: 'org-1',
        recipientPhone: '+5511999999999',
        locale: 'pt-BR',
        data: baseData,
        planType: 'professional',
      })
    }).not.toThrow()
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'WhatsApp notification failed',
        expect.objectContaining({ event: 'appointment.confirmed' }),
      )
    })
    errorSpy.mockRestore()
  })

  it('should not throw when EmailService fails (fire-and-forget)', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockEmailService.sendBookingConfirmation.mockRejectedValueOnce(new Error('SMTP error'))
    expect(() => {
      service.send({
        event: 'appointment.confirmed',
        organizationId: 'org-1',
        recipientEmail: 'test@example.com',
        locale: 'pt-BR',
        data: baseData,
        planType: 'essential',
      })
    }).not.toThrow()
    await vi.waitFor(() => {
      expect(errorSpy).toHaveBeenCalledWith(
        'Email notification failed',
        expect.objectContaining({ event: 'appointment.confirmed' }),
      )
    })
    errorSpy.mockRestore()
  })

  it('should log successful notification send with channel and event context', async () => {
    const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    service.send({
      event: 'appointment.confirmed',
      organizationId: 'org-1',
      recipientPhone: '+5511999999999',
      locale: 'pt-BR',
      data: baseData,

      planType: 'professional',
    })
    await vi.waitFor(() => {
      expect(logSpy).toHaveBeenCalledWith('Notification sent', {
        channel: 'whatsapp',
        event: 'appointment.confirmed',
        organizationId: 'org-1',
      })
    })
    logSpy.mockRestore()
  })

  it('should map each event to the correct WhatsApp template', () => {
    const events = [
      { event: 'appointment.confirmed' as const, template: 'appointment_confirmation' },
      { event: 'appointment.cancelled' as const, template: 'appointment_cancellation' },
      { event: 'appointment.rescheduled' as const, template: 'appointment_reschedule' },
      { event: 'appointment.reminder' as const, template: 'appointment_reminder' },
    ]
    for (const { event, template } of events) {
      mockWhatsAppService.sendTemplate.mockClear()
      service.send({
        event,
        organizationId: 'org-1',
        recipientPhone: '+5511999999999',
        locale: 'pt-BR',
        data: { ...baseData, oldDate: '19/02/2026', oldTime: '10:00', newDate: '20/02/2026', newTime: '14:00' },
        planType: 'professional',
      })
      expect(mockWhatsAppService.sendTemplate).toHaveBeenCalledWith(expect.objectContaining({ templateName: template }))
    }
  })
})
