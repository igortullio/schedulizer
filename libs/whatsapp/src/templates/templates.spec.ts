import { describe, expect, it } from 'vitest'
import {
  buildCancellationComponents,
  buildConfirmationComponents,
  buildReminderComponents,
  buildRescheduleComponents,
  CANCELLATION_TEMPLATE_NAME,
  CONFIRMATION_TEMPLATE_NAME,
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
        serviceName: 'Corte de Cabelo',
        appointmentDate: '20/02/2026',
        appointmentTime: '14:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'João' },
            { type: 'text', text: 'Corte de Cabelo' },
            { type: 'text', text: '20/02/2026 14:00' },
          ],
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
        serviceName: 'Barba',
        appointmentDate: '21/02/2026',
        appointmentTime: '10:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Maria' },
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
            { type: 'text', text: 'Pedro' },
            { type: 'text', text: 'Corte + Barba' },
            { type: 'text', text: '20/02/2026 14:00' },
            { type: 'text', text: '22/02/2026 16:00' },
          ],
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
        serviceName: 'Manicure',
        appointmentDate: '23/02/2026',
        appointmentTime: '09:00',
      })
      expect(components).toEqual([
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Ana' },
            { type: 'text', text: 'Manicure' },
            { type: 'text', text: '23/02/2026 09:00' },
          ],
        },
      ])
    })
  })
})
