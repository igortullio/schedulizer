import { Resend } from 'resend'
import { TemplateRegistry } from './template-registry'
import type {
  AppointmentReminderParams,
  BookingCancellationParams,
  BookingConfirmationParams,
  BookingRescheduleParams,
  InvitationParams,
  MagicLinkParams,
  OwnerCancellationParams,
  OwnerNewBookingParams,
  OwnerRescheduleParams,
} from './template-variables'
import { EMAIL_FROM, EmailType } from './types'

interface EmailServiceConfig {
  apiKey: string
}

export class EmailService {
  private readonly resend: Resend
  private readonly registry: TemplateRegistry

  constructor(config: EmailServiceConfig) {
    this.resend = new Resend(config.apiKey)
    this.registry = new TemplateRegistry()
  }

  async sendMagicLink(params: MagicLinkParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.MagicLink, params.locale)
    const subject = params.locale === 'pt-BR' ? 'Seu link de acesso' : 'Your login link'
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: { magicLinkUrl: params.magicLinkUrl },
    })
  }

  async sendBookingConfirmation(params: BookingConfirmationParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.BookingConfirmation, params.locale)
    const subject =
      params.locale === 'pt-BR'
        ? `Reserva confirmada - ${params.organizationName}`
        : `Booking confirmed - ${params.organizationName}`
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        organizationName: params.organizationName,
        cancelUrl: params.cancelUrl,
        rescheduleUrl: params.rescheduleUrl,
      },
    })
  }

  async sendBookingCancellation(params: BookingCancellationParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.BookingCancellation, params.locale)
    const subject =
      params.locale === 'pt-BR'
        ? `Reserva cancelada - ${params.organizationName}`
        : `Booking cancelled - ${params.organizationName}`
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        organizationName: params.organizationName,
      },
    })
  }

  async sendBookingReschedule(params: BookingRescheduleParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.BookingReschedule, params.locale)
    const subject =
      params.locale === 'pt-BR'
        ? `Reserva reagendada - ${params.organizationName}`
        : `Booking rescheduled - ${params.organizationName}`
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        serviceName: params.serviceName,
        oldDate: params.oldDate,
        oldTime: params.oldTime,
        newDate: params.newDate,
        newTime: params.newTime,
        organizationName: params.organizationName,
        cancelUrl: params.cancelUrl,
        rescheduleUrl: params.rescheduleUrl,
      },
    })
  }

  async sendAppointmentReminder(params: AppointmentReminderParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.AppointmentReminder, params.locale)
    const subject =
      params.locale === 'pt-BR'
        ? `Lembrete: sua reserva amanhã - ${params.organizationName}`
        : `Reminder: your booking tomorrow - ${params.organizationName}`
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
        organizationName: params.organizationName,
        cancelUrl: params.cancelUrl,
        rescheduleUrl: params.rescheduleUrl,
      },
    })
  }

  async sendOwnerNewBooking(params: OwnerNewBookingParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.OwnerNewBooking, params.locale)
    const subject = params.locale === 'pt-BR' ? 'Nova reserva recebida' : 'New booking received'
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
      },
    })
  }

  async sendOwnerCancellation(params: OwnerCancellationParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.OwnerCancellation, params.locale)
    const subject = params.locale === 'pt-BR' ? 'Reserva cancelada pelo cliente' : 'Booking cancelled by customer'
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        serviceName: params.serviceName,
        appointmentDate: params.appointmentDate,
        appointmentTime: params.appointmentTime,
      },
    })
  }

  async sendInvitation(params: InvitationParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.Invitation, params.locale)
    const subject =
      params.locale === 'pt-BR' ? `Convite para ${params.organizationName}` : `Invitation to ${params.organizationName}`
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        inviterName: params.inviterName,
        organizationName: params.organizationName,
        inviteUrl: params.inviteUrl,
        role: params.role,
      },
    })
  }

  async sendOwnerReschedule(params: OwnerRescheduleParams): Promise<void> {
    const templateId = this.registry.getTemplateId(EmailType.OwnerReschedule, params.locale)
    const subject = params.locale === 'pt-BR' ? 'Reserva reagendada pelo cliente' : 'Booking rescheduled by customer'
    await this.sendWithTemplate({
      to: params.to,
      subject,
      templateId,
      variables: {
        customerName: params.customerName,
        customerEmail: params.customerEmail,
        serviceName: params.serviceName,
        oldDate: params.oldDate,
        oldTime: params.oldTime,
        newDate: params.newDate,
        newTime: params.newTime,
      },
    })
  }

  private async sendWithTemplate(params: SendWithTemplateParams): Promise<void> {
    try {
      const { data, error } = await this.resend.emails.send({
        from: EMAIL_FROM,
        to: params.to,
        subject: params.subject,
        template: {
          id: params.templateId,
          variables: params.variables,
        },
      })
      if (error) {
        console.error('Email send failed', {
          templateId: params.templateId,
          error: error.message,
        })
        return
      }
      console.log('Email sent', {
        templateId: params.templateId,
        resendEmailId: data?.id,
      })
    } catch (error) {
      console.error('Email send failed', {
        templateId: params.templateId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }
}

interface SendWithTemplateParams {
  to: string
  subject: string
  templateId: string
  variables: Record<string, string>
}
