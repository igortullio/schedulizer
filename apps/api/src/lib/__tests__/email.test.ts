import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    resendApiKey: 'test-resend-key',
  },
}))

const { mockSend } = vi.hoisted(() => ({
  mockSend: vi.fn(),
}))

vi.mock('resend', () => ({
  Resend: class MockResend {
    emails = { send: mockSend }
  },
}))

import {
  sendBookingCancellation,
  sendBookingConfirmation,
  sendBookingReschedule,
  sendOwnerCancellationNotification,
  sendOwnerNewBookingNotification,
  sendOwnerRescheduleNotification,
  sendReminder,
} from '../email'

describe('Email Module', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('sendBookingConfirmation', () => {
    it('should send confirmation email successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendBookingConfirmation({
        to: 'customer@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '15/03/2025 09:00',
        organizationName: 'Test Business',
        managementUrl: 'http://localhost/booking/test/manage/token-123',
      })
      expect(mockSend).toHaveBeenCalledTimes(1)
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: 'Booking confirmed - Test Business',
        }),
      )
    })

    it('should throw on Resend error', async () => {
      mockSend.mockResolvedValueOnce({ error: { message: 'Rate limit exceeded' } })
      await expect(
        sendBookingConfirmation({
          to: 'customer@example.com',
          customerName: 'John Doe',
          serviceName: 'Haircut',
          dateTime: '15/03/2025 09:00',
          organizationName: 'Test Business',
          managementUrl: 'http://localhost/booking/test/manage/token-123',
        }),
      ).rejects.toThrow('Failed to send booking confirmation: Rate limit exceeded')
    })
  })

  describe('sendBookingCancellation', () => {
    it('should send cancellation email successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendBookingCancellation({
        to: 'customer@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '15/03/2025 09:00',
        organizationName: 'Test Business',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: 'Booking cancelled - Test Business',
        }),
      )
    })
  })

  describe('sendBookingReschedule', () => {
    it('should send reschedule email successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendBookingReschedule({
        to: 'customer@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        oldDateTime: '15/03/2025 09:00',
        newDateTime: '16/03/2025 10:00',
        organizationName: 'Test Business',
        managementUrl: 'http://localhost/booking/test/manage/token-123',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: 'Booking rescheduled - Test Business',
        }),
      )
    })
  })

  describe('sendReminder', () => {
    it('should send reminder email successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendReminder({
        to: 'customer@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '16/03/2025 09:00',
        organizationName: 'Test Business',
        managementUrl: 'http://localhost/booking/test/manage/token-123',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'customer@example.com',
          subject: 'Reminder: Your booking tomorrow - Test Business',
        }),
      )
    })
  })

  describe('sendOwnerNewBookingNotification', () => {
    it('should send owner notification email successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendOwnerNewBookingNotification({
        to: 'owner@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '15/03/2025 09:00',
        organizationName: 'Test Business',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@example.com',
          subject: 'New booking received - Test Business',
        }),
      )
    })
  })

  describe('sendOwnerCancellationNotification', () => {
    it('should send owner cancellation notification successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendOwnerCancellationNotification({
        to: 'owner@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '15/03/2025 09:00',
        organizationName: 'Test Business',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@example.com',
          subject: 'Booking cancelled by customer - Test Business',
        }),
      )
    })
  })

  describe('sendOwnerRescheduleNotification', () => {
    it('should send owner reschedule notification successfully', async () => {
      mockSend.mockResolvedValueOnce({ error: null })
      await sendOwnerRescheduleNotification({
        to: 'owner@example.com',
        customerName: 'John Doe',
        serviceName: 'Haircut',
        dateTime: '15/03/2025 09:00',
        newDateTime: '16/03/2025 10:00',
        organizationName: 'Test Business',
      })
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'owner@example.com',
          subject: 'Booking rescheduled by customer - Test Business',
        }),
      )
    })
  })
})
