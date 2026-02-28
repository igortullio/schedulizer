import { describe, expect, it } from 'vitest'
import {
  buildCancellationComponents,
  buildConfirmationComponents,
  buildOwnerCancellationComponents,
  buildOwnerNewBookingComponents,
  buildOwnerRescheduleComponents,
  buildReminderComponents,
  buildRescheduleComponents,
  CANCELLATION_TEMPLATE_NAME,
  CONFIRMATION_TEMPLATE_NAME,
  OWNER_CANCELLATION_TEMPLATE_NAME,
  OWNER_NEW_BOOKING_TEMPLATE_NAME,
  OWNER_RESCHEDULE_TEMPLATE_NAME,
  REMINDER_TEMPLATE_NAME,
  RESCHEDULE_TEMPLATE_NAME,
} from './index'

describe('templates', () => {
  describe('confirmation', () => {
    it('should have correct template name', () => {
      expect(CONFIRMATION_TEMPLATE_NAME).toBe('appointment_confirmation')
    })

    it('should build components with correct parameters', () => {
      const components = buildConfirmationComponents({
        customerName: 'João',
        organizationName: 'Barbearia do João',
        serviceName: 'Corte de Cabelo',
        appointmentDate: '20/02/2026',
        appointmentTime: '14:00',
        rescheduleUrlSuffix: 'barbearia/manage/abc123?action=reschedule',
        cancelUrlSuffix: 'barbearia/manage/abc123?action=cancel',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'João' },
            { type: 'text', text: 'Barbearia do João' },
            { type: 'text', text: 'Corte de Cabelo' },
            { type: 'text', text: '20/02/2026 14:00' },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: 'barbearia/manage/abc123?action=reschedule' }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 1,
          parameters: [{ type: 'text', text: 'barbearia/manage/abc123?action=cancel' }],
        },
      ])
    })
  })

  describe('reminder', () => {
    it('should have correct template name', () => {
      expect(REMINDER_TEMPLATE_NAME).toBe('appointment_reminder')
    })

    it('should build components with correct parameters', () => {
      const components = buildReminderComponents({
        customerName: 'Ana',
        organizationName: 'Salão da Ana',
        serviceName: 'Manicure',
        appointmentDate: '23/02/2026',
        appointmentTime: '09:00',
        rescheduleUrlSuffix: 'salao/manage/def456?action=reschedule',
        cancelUrlSuffix: 'salao/manage/def456?action=cancel',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Ana' },
            { type: 'text', text: 'Salão da Ana' },
            { type: 'text', text: 'Manicure' },
            { type: 'text', text: '23/02/2026 09:00' },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: 'salao/manage/def456?action=reschedule' }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 1,
          parameters: [{ type: 'text', text: 'salao/manage/def456?action=cancel' }],
        },
      ])
    })
  })

  describe('cancellation', () => {
    it('should have correct template name', () => {
      expect(CANCELLATION_TEMPLATE_NAME).toBe('appointment_cancellation')
    })

    it('should build components with correct parameters', () => {
      const components = buildCancellationComponents({
        customerName: 'Maria',
        organizationName: 'Studio Maria',
        serviceName: 'Barba',
        appointmentDate: '21/02/2026',
        appointmentTime: '10:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Maria' },
            { type: 'text', text: 'Studio Maria' },
            { type: 'text', text: 'Barba' },
            { type: 'text', text: '21/02/2026 10:00' },
          ],
        },
      ])
    })
  })

  describe('reschedule', () => {
    it('should have correct template name', () => {
      expect(RESCHEDULE_TEMPLATE_NAME).toBe('appointment_reschedule')
    })

    it('should build components with correct parameters', () => {
      const components = buildRescheduleComponents({
        customerName: 'Pedro',
        organizationName: 'Barbearia Premium',
        serviceName: 'Corte + Barba',
        oldDate: '20/02/2026',
        oldTime: '14:00',
        newDate: '22/02/2026',
        newTime: '16:00',
        rescheduleUrlSuffix: 'premium/manage/ghi789?action=reschedule',
        cancelUrlSuffix: 'premium/manage/ghi789?action=cancel',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Pedro' },
            { type: 'text', text: 'Barbearia Premium' },
            { type: 'text', text: 'Corte + Barba' },
            { type: 'text', text: '20/02/2026 14:00' },
            { type: 'text', text: '22/02/2026 16:00' },
          ],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 0,
          parameters: [{ type: 'text', text: 'premium/manage/ghi789?action=reschedule' }],
        },
        {
          type: 'button',
          sub_type: 'url',
          index: 1,
          parameters: [{ type: 'text', text: 'premium/manage/ghi789?action=cancel' }],
        },
      ])
    })
  })

  describe('owner-new-booking', () => {
    it('should have correct template name', () => {
      expect(OWNER_NEW_BOOKING_TEMPLATE_NAME).toBe('owner_new_booking')
    })

    it('should build components with correct parameters', () => {
      const components = buildOwnerNewBookingComponents({
        organizationName: 'Barbearia do João',
        customerName: 'Carlos',
        customerEmail: 'carlos@test.com',
        serviceName: 'Corte de Cabelo',
        appointmentDate: '25/02/2026',
        appointmentTime: '15:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Barbearia do João' },
            { type: 'text', text: 'Carlos' },
            { type: 'text', text: 'carlos@test.com' },
            { type: 'text', text: 'Corte de Cabelo' },
            { type: 'text', text: '25/02/2026 15:00' },
          ],
        },
      ])
    })
  })

  describe('owner-cancellation', () => {
    it('should have correct template name', () => {
      expect(OWNER_CANCELLATION_TEMPLATE_NAME).toBe('owner_cancellation')
    })

    it('should build components with correct parameters', () => {
      const components = buildOwnerCancellationComponents({
        organizationName: 'Salão da Ana',
        customerName: 'Maria',
        customerEmail: 'maria@test.com',
        serviceName: 'Manicure',
        appointmentDate: '26/02/2026',
        appointmentTime: '10:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Salão da Ana' },
            { type: 'text', text: 'Maria' },
            { type: 'text', text: 'maria@test.com' },
            { type: 'text', text: 'Manicure' },
            { type: 'text', text: '26/02/2026 10:00' },
          ],
        },
      ])
    })
  })

  describe('owner-reschedule', () => {
    it('should have correct template name', () => {
      expect(OWNER_RESCHEDULE_TEMPLATE_NAME).toBe('owner_reschedule')
    })

    it('should build components with correct parameters', () => {
      const components = buildOwnerRescheduleComponents({
        organizationName: 'Studio Premium',
        customerName: 'Pedro',
        customerEmail: 'pedro@test.com',
        serviceName: 'Corte + Barba',
        oldDate: '20/02/2026',
        oldTime: '14:00',
        newDate: '22/02/2026',
        newTime: '16:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Studio Premium' },
            { type: 'text', text: 'Pedro' },
            { type: 'text', text: 'pedro@test.com' },
            { type: 'text', text: 'Corte + Barba' },
            { type: 'text', text: '20/02/2026 14:00' },
            { type: 'text', text: '22/02/2026 16:00' },
          ],
        },
      ])
    })
  })
})
