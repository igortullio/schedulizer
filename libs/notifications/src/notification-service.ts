import type { EmailService } from '@schedulizer/email'
import type { WhatsAppService } from '@schedulizer/whatsapp'
import {
  buildCancellationComponents,
  buildConfirmationComponents,
  buildReminderComponents,
  buildRescheduleComponents,
  CANCELLATION_TEMPLATE_NAME,
  CONFIRMATION_TEMPLATE_NAME,
  REMINDER_TEMPLATE_NAME,
  RESCHEDULE_TEMPLATE_NAME,
} from '@schedulizer/whatsapp'
import type { ChannelResolver } from './channel-resolver'
import type { NotificationEvent, SendNotificationParams } from './notification-types'

interface NotificationServiceDeps {
  channelResolver: ChannelResolver
  whatsAppService: WhatsAppService
  emailService: EmailService
}

const EVENT_TO_TEMPLATE: Record<NotificationEvent, string> = {
  'appointment.confirmed': CONFIRMATION_TEMPLATE_NAME,
  'appointment.cancelled': CANCELLATION_TEMPLATE_NAME,
  'appointment.rescheduled': RESCHEDULE_TEMPLATE_NAME,
  'appointment.reminder': REMINDER_TEMPLATE_NAME,
}

const LOCALE_TO_LANGUAGE_CODE: Record<string, string> = {
  'pt-BR': 'pt_BR',
  en: 'en_US',
}

export class NotificationService {
  private readonly channelResolver: ChannelResolver
  private readonly whatsAppService: WhatsAppService
  private readonly emailService: EmailService

  constructor(deps: NotificationServiceDeps) {
    this.channelResolver = deps.channelResolver
    this.whatsAppService = deps.whatsAppService
    this.emailService = deps.emailService
  }

  send(params: SendNotificationParams & { planType: string }): void {
    const channel = this.channelResolver.resolve({
      recipientPhone: params.recipientPhone,
      planType: params.planType,
    })
    if (channel === 'whatsapp') {
      this.sendViaWhatsApp(params)
        .then(() => {
          console.log('Notification sent', {
            channel: 'whatsapp',
            event: params.event,
            organizationId: params.organizationId,
          })
        })
        .catch(error => {
          console.error('WhatsApp notification failed', {
            event: params.event,
            organizationId: params.organizationId,
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        })
      return
    }
    this.sendViaEmail(params)
      .then(() => {
        console.log('Notification sent', {
          channel: 'email',
          event: params.event,
          organizationId: params.organizationId,
        })
      })
      .catch(error => {
        console.error('Email notification failed', {
          event: params.event,
          organizationId: params.organizationId,
          error: error instanceof Error ? error.message : 'Unknown error',
        })
      })
  }

  private async sendViaWhatsApp(params: SendNotificationParams & { planType: string }): Promise<void> {
    const templateName = EVENT_TO_TEMPLATE[params.event]
    const languageCode = LOCALE_TO_LANGUAGE_CODE[params.locale] ?? 'pt_BR'
    const components = this.buildWhatsAppComponents(params.event, params.data)
    await this.whatsAppService.sendTemplate({
      to: params.recipientPhone!,
      templateName,
      languageCode,
      components,
    })
  }

  private async sendViaEmail(params: SendNotificationParams): Promise<void> {
    if (!params.recipientEmail) {
      console.error('Email notification skipped: no recipientEmail', {
        event: params.event,
        organizationId: params.organizationId,
      })
      return
    }
    const locale = params.locale === 'en' ? 'en' : 'pt-BR'
    switch (params.event) {
      case 'appointment.confirmed':
        await this.emailService.sendBookingConfirmation({
          to: params.recipientEmail,
          locale,
          customerName: params.data.customerName ?? '',
          serviceName: params.data.serviceName ?? '',
          appointmentDate: params.data.appointmentDate ?? '',
          appointmentTime: params.data.appointmentTime ?? '',
          organizationName: params.data.organizationName ?? '',
          cancelUrl: params.data.cancelUrl ?? '',
          rescheduleUrl: params.data.rescheduleUrl ?? '',
        })
        break
      case 'appointment.cancelled':
        await this.emailService.sendBookingCancellation({
          to: params.recipientEmail,
          locale,
          customerName: params.data.customerName ?? '',
          serviceName: params.data.serviceName ?? '',
          appointmentDate: params.data.appointmentDate ?? '',
          appointmentTime: params.data.appointmentTime ?? '',
          organizationName: params.data.organizationName ?? '',
        })
        break
      case 'appointment.rescheduled':
        await this.emailService.sendBookingReschedule({
          to: params.recipientEmail,
          locale,
          customerName: params.data.customerName ?? '',
          serviceName: params.data.serviceName ?? '',
          oldDate: params.data.oldDate ?? '',
          oldTime: params.data.oldTime ?? '',
          newDate: params.data.newDate ?? '',
          newTime: params.data.newTime ?? '',
          organizationName: params.data.organizationName ?? '',
          cancelUrl: params.data.cancelUrl ?? '',
          rescheduleUrl: params.data.rescheduleUrl ?? '',
        })
        break
      case 'appointment.reminder':
        await this.emailService.sendAppointmentReminder({
          to: params.recipientEmail,
          locale,
          customerName: params.data.customerName ?? '',
          serviceName: params.data.serviceName ?? '',
          appointmentDate: params.data.appointmentDate ?? '',
          appointmentTime: params.data.appointmentTime ?? '',
          organizationName: params.data.organizationName ?? '',
          cancelUrl: params.data.cancelUrl ?? '',
          rescheduleUrl: params.data.rescheduleUrl ?? '',
        })
        break
    }
  }

  private buildWhatsAppComponents(event: NotificationEvent, data: Record<string, string>) {
    switch (event) {
      case 'appointment.confirmed':
        return buildConfirmationComponents({
          customerName: data.customerName ?? '',
          organizationName: data.organizationName ?? '',
          serviceName: data.serviceName ?? '',
          appointmentDate: data.appointmentDate ?? '',
          appointmentTime: data.appointmentTime ?? '',
          rescheduleUrlSuffix: data.rescheduleUrlSuffix ?? '',
          cancelUrlSuffix: data.cancelUrlSuffix ?? '',
        })
      case 'appointment.cancelled':
        return buildCancellationComponents({
          customerName: data.customerName ?? '',
          organizationName: data.organizationName ?? '',
          serviceName: data.serviceName ?? '',
          appointmentDate: data.appointmentDate ?? '',
          appointmentTime: data.appointmentTime ?? '',
        })
      case 'appointment.rescheduled':
        return buildRescheduleComponents({
          customerName: data.customerName ?? '',
          organizationName: data.organizationName ?? '',
          serviceName: data.serviceName ?? '',
          oldDate: data.oldDate ?? '',
          oldTime: data.oldTime ?? '',
          newDate: data.newDate ?? '',
          newTime: data.newTime ?? '',
          rescheduleUrlSuffix: data.rescheduleUrlSuffix ?? '',
          cancelUrlSuffix: data.cancelUrlSuffix ?? '',
        })
      case 'appointment.reminder':
        return buildReminderComponents({
          customerName: data.customerName ?? '',
          organizationName: data.organizationName ?? '',
          serviceName: data.serviceName ?? '',
          appointmentDate: data.appointmentDate ?? '',
          appointmentTime: data.appointmentTime ?? '',
          rescheduleUrlSuffix: data.rescheduleUrlSuffix ?? '',
          cancelUrlSuffix: data.cancelUrlSuffix ?? '',
        })
    }
  }
}
