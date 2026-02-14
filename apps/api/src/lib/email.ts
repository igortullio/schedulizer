import { serverEnv } from '@schedulizer/env/server'
import { Resend } from 'resend'

const resend = new Resend(serverEnv.resendApiKey)

const EMAIL_FROM = 'Schedulizer <noreply@contact.schedulizer.me>'

interface SendBookingConfirmationParams {
  to: string
  customerName: string
  serviceName: string
  dateTime: string
  organizationName: string
  managementUrl: string
}

interface SendBookingCancellationParams {
  to: string
  customerName: string
  serviceName: string
  dateTime: string
  organizationName: string
}

interface SendBookingRescheduleParams {
  to: string
  customerName: string
  serviceName: string
  oldDateTime: string
  newDateTime: string
  organizationName: string
  managementUrl: string
}

interface SendReminderParams {
  to: string
  customerName: string
  serviceName: string
  dateTime: string
  organizationName: string
  managementUrl: string
}

interface SendOwnerNotificationParams {
  to: string
  customerName: string
  serviceName: string
  dateTime: string
  organizationName: string
}

export async function sendBookingConfirmation(params: SendBookingConfirmationParams): Promise<void> {
  const { to, customerName, serviceName, dateTime, organizationName, managementUrl } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Booking confirmed - ${organizationName}`,
    html: `
      <h1>Booking Confirmed!</h1>
      <p>Hi ${customerName},</p>
      <p>Your booking has been confirmed with the following details:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date/Time:</strong> ${dateTime}</li>
        <li><strong>Business:</strong> ${organizationName}</li>
      </ul>
      <p>To manage your booking (cancel or reschedule), click the link below:</p>
      <a href="${managementUrl}">Manage Booking</a>
      <p>Thank you for your booking!</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send booking confirmation: ${error.message}`)
  }
}

export async function sendBookingCancellation(params: SendBookingCancellationParams): Promise<void> {
  const { to, customerName, serviceName, dateTime, organizationName } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Booking cancelled - ${organizationName}`,
    html: `
      <h1>Booking Cancelled</h1>
      <p>Hi ${customerName},</p>
      <p>Your booking has been cancelled:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date/Time:</strong> ${dateTime}</li>
        <li><strong>Business:</strong> ${organizationName}</li>
      </ul>
      <p>If you'd like to book again, visit the business's booking page.</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send cancellation email: ${error.message}`)
  }
}

export async function sendBookingReschedule(params: SendBookingRescheduleParams): Promise<void> {
  const { to, customerName, serviceName, oldDateTime, newDateTime, organizationName, managementUrl } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Booking rescheduled - ${organizationName}`,
    html: `
      <h1>Booking Rescheduled</h1>
      <p>Hi ${customerName},</p>
      <p>Your booking has been rescheduled:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Previous Date/Time:</strong> ${oldDateTime}</li>
        <li><strong>New Date/Time:</strong> ${newDateTime}</li>
        <li><strong>Business:</strong> ${organizationName}</li>
      </ul>
      <p>To manage your booking, click the link below:</p>
      <a href="${managementUrl}">Manage Booking</a>
    `,
  })
  if (error) {
    throw new Error(`Failed to send reschedule email: ${error.message}`)
  }
}

export async function sendReminder(params: SendReminderParams): Promise<void> {
  const { to, customerName, serviceName, dateTime, organizationName, managementUrl } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Reminder: Your booking tomorrow - ${organizationName}`,
    html: `
      <h1>Booking Reminder</h1>
      <p>Hi ${customerName},</p>
      <p>This is a reminder about your upcoming booking:</p>
      <ul>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date/Time:</strong> ${dateTime}</li>
        <li><strong>Business:</strong> ${organizationName}</li>
      </ul>
      <p>To manage your booking, click the link below:</p>
      <a href="${managementUrl}">Manage Booking</a>
      <p>We look forward to seeing you!</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send reminder email: ${error.message}`)
  }
}

export async function sendOwnerNewBookingNotification(params: SendOwnerNotificationParams): Promise<void> {
  const { to, customerName, serviceName, dateTime, organizationName } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `New booking received - ${organizationName}`,
    html: `
      <h1>New Booking Received!</h1>
      <p>A new booking has been made:</p>
      <ul>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date/Time:</strong> ${dateTime}</li>
      </ul>
      <p>Check your dashboard for more details.</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send owner notification: ${error.message}`)
  }
}

export async function sendOwnerCancellationNotification(params: SendOwnerNotificationParams): Promise<void> {
  const { to, customerName, serviceName, dateTime, organizationName } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Booking cancelled by customer - ${organizationName}`,
    html: `
      <h1>Booking Cancelled</h1>
      <p>A booking has been cancelled by the customer:</p>
      <ul>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Date/Time:</strong> ${dateTime}</li>
      </ul>
      <p>The time slot is now available again.</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send owner cancellation notification: ${error.message}`)
  }
}

export async function sendOwnerRescheduleNotification(
  params: SendOwnerNotificationParams & { newDateTime: string },
): Promise<void> {
  const { to, customerName, serviceName, dateTime, newDateTime, organizationName } = params
  const { error } = await resend.emails.send({
    from: EMAIL_FROM,
    to,
    subject: `Booking rescheduled by customer - ${organizationName}`,
    html: `
      <h1>Booking Rescheduled</h1>
      <p>A booking has been rescheduled by the customer:</p>
      <ul>
        <li><strong>Customer:</strong> ${customerName}</li>
        <li><strong>Service:</strong> ${serviceName}</li>
        <li><strong>Previous Date/Time:</strong> ${dateTime}</li>
        <li><strong>New Date/Time:</strong> ${newDateTime}</li>
      </ul>
      <p>Check your dashboard for more details.</p>
    `,
  })
  if (error) {
    throw new Error(`Failed to send owner reschedule notification: ${error.message}`)
  }
}
