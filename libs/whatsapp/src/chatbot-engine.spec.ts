import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { AppointmentDeps } from './chatbot-engine'
import { ChatbotEngine } from './chatbot-engine'
import type { SessionRepository } from './session/session-repository'
import type { ChatbotSession } from './session/session-types'
import type { WhatsAppService } from './whatsapp-service'

function createMockSessionRepository() {
  return {
    findActiveByPhone: vi.fn(),
    create: vi.fn(),
    update: vi
      .fn<SessionRepository['update']>()
      .mockImplementation(async (_id, params) =>
        createSession({ currentStep: params.currentStep, context: params.context }),
      ),
    deleteExpired: vi.fn(),
  } as unknown as SessionRepository
}

function createMockWhatsAppService() {
  return {
    sendText: vi.fn().mockResolvedValue({ messageId: 'wamid.test', success: true }),
    sendTemplate: vi.fn(),
    markAsRead: vi.fn(),
  } as unknown as WhatsAppService
}

function createMockAppointmentDeps(): AppointmentDeps {
  return {
    listServices: vi.fn().mockResolvedValue([
      { id: 'svc-1', name: 'Haircut' },
      { id: 'svc-2', name: 'Beard' },
    ]),
    listAvailableSlots: vi.fn().mockResolvedValue([
      { startTime: '2026-02-20T14:00:00Z', endTime: '2026-02-20T14:30:00Z' },
      { startTime: '2026-02-20T15:00:00Z', endTime: '2026-02-20T15:30:00Z' },
    ]),
    createAppointment: vi.fn().mockResolvedValue({ id: 'apt-123' }),
  }
}

const PHONE = '+5511999999999'
const ORG_ID = 'org-123'

function createSession(overrides: Partial<ChatbotSession> = {}): ChatbotSession {
  return {
    id: 'session-1',
    phoneNumber: PHONE,
    organizationId: ORG_ID,
    currentStep: 'welcome',
    context: {},
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

describe('ChatbotEngine', () => {
  let engine: ChatbotEngine
  let sessionRepo: ReturnType<typeof createMockSessionRepository>
  let whatsAppService: ReturnType<typeof createMockWhatsAppService>
  let appointmentDeps: AppointmentDeps

  beforeEach(() => {
    sessionRepo = createMockSessionRepository()
    whatsAppService = createMockWhatsAppService()
    appointmentDeps = createMockAppointmentDeps()
    engine = new ChatbotEngine({
      sessionRepository: sessionRepo,
      whatsAppService,
      appointmentDeps,
    })
  })

  describe('welcome step', () => {
    it('should show service list when user selects option 1', async () => {
      const session = createSession()
      await engine.handleMessage({ session, messageBody: '1' })
      expect(appointmentDeps.listServices).toHaveBeenCalledWith(ORG_ID)
      expect(sessionRepo.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({ currentStep: 'select_service' }),
      )
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('1. Haircut'),
      })
    })

    it('should show welcome menu for invalid input', async () => {
      const session = createSession()
      await engine.handleMessage({ session, messageBody: 'abc' })
      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', expect.objectContaining({ currentStep: 'welcome' }))
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('Schedule an appointment'),
      })
    })

    it('should handle no services available', async () => {
      vi.mocked(appointmentDeps.listServices).mockResolvedValueOnce([])
      const session = createSession()
      await engine.handleMessage({ session, messageBody: '1' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: 'No services available at the moment.',
      })
    })
  })

  describe('select_service step', () => {
    it('should advance to select_date when valid service chosen', async () => {
      const session = createSession({
        currentStep: 'select_service',
        context: {
          availableServices: [
            { id: 'svc-1', name: 'Haircut' },
            { id: 'svc-2', name: 'Beard' },
          ],
        },
      })
      await engine.handleMessage({ session, messageBody: '1' })
      expect(sessionRepo.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          currentStep: 'select_date',
          context: expect.objectContaining({ selectedServiceId: 'svc-1' }),
        }),
      )
    })

    it('should show error for invalid service selection', async () => {
      const session = createSession({
        currentStep: 'select_service',
        context: { availableServices: [{ id: 'svc-1', name: 'Haircut' }] },
      })
      await engine.handleMessage({ session, messageBody: '5' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('Invalid option'),
      })
    })
  })

  describe('select_date step', () => {
    it('should list available slots for valid date', async () => {
      const session = createSession({
        currentStep: 'select_date',
        context: { selectedServiceId: 'svc-1' },
      })
      await engine.handleMessage({ session, messageBody: '20/02/2026' })
      expect(appointmentDeps.listAvailableSlots).toHaveBeenCalledWith({
        serviceId: 'svc-1',
        date: '2026-02-20',
        organizationId: ORG_ID,
      })
      expect(sessionRepo.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          currentStep: 'select_time',
        }),
      )
    })

    it('should reject invalid date format', async () => {
      const session = createSession({ currentStep: 'select_date', context: { selectedServiceId: 'svc-1' } })
      await engine.handleMessage({ session, messageBody: '2026-02-20' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('DD/MM/YYYY'),
      })
    })

    it('should handle no available slots', async () => {
      vi.mocked(appointmentDeps.listAvailableSlots).mockResolvedValueOnce([])
      const session = createSession({ currentStep: 'select_date', context: { selectedServiceId: 'svc-1' } })
      await engine.handleMessage({ session, messageBody: '20/02/2026' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('No available slots'),
      })
    })
  })

  describe('select_time step', () => {
    it('should advance to confirm when valid time chosen', async () => {
      const session = createSession({
        currentStep: 'select_time',
        context: {
          selectedServiceId: 'svc-1',
          selectedDate: '2026-02-20',
          availableSlots: ['2026-02-20T14:00:00Z', '2026-02-20T15:00:00Z'],
          availableServices: [{ id: 'svc-1', name: 'Haircut' }],
        },
      })
      await engine.handleMessage({ session, messageBody: '1' })
      expect(sessionRepo.update).toHaveBeenCalledWith(
        'session-1',
        expect.objectContaining({
          currentStep: 'confirm',
          context: expect.objectContaining({ selectedTimeSlot: '2026-02-20T14:00:00Z' }),
        }),
      )
    })

    it('should show error for invalid time selection', async () => {
      const session = createSession({
        currentStep: 'select_time',
        context: { availableSlots: ['2026-02-20T14:00:00Z'] },
      })
      await engine.handleMessage({ session, messageBody: '99' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('Invalid option'),
      })
    })
  })

  describe('confirm step', () => {
    it('should create appointment when user confirms', async () => {
      const session = createSession({
        currentStep: 'confirm',
        context: {
          selectedServiceId: 'svc-1',
          selectedDate: '2026-02-20',
          selectedTimeSlot: '2026-02-20T14:00:00Z',
        },
      })
      await engine.handleMessage({ session, messageBody: '1' })
      expect(appointmentDeps.createAppointment).toHaveBeenCalledWith({
        organizationId: ORG_ID,
        serviceId: 'svc-1',
        startTime: '2026-02-20T14:00:00Z',
        customerPhone: PHONE,
      })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('apt-123'),
      })
    })

    it('should cancel and go back to welcome when user types 2', async () => {
      const session = createSession({
        currentStep: 'confirm',
        context: { selectedServiceId: 'svc-1' },
      })
      await engine.handleMessage({ session, messageBody: '2' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: 'Appointment cancelled.',
      })
    })

    it('should show prompt for invalid input', async () => {
      const session = createSession({ currentStep: 'confirm', context: {} })
      await engine.handleMessage({ session, messageBody: 'abc' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: 'Type 1 to confirm or 2 to cancel.',
      })
    })

    it('should handle appointment creation failure', async () => {
      vi.mocked(appointmentDeps.createAppointment).mockRejectedValueOnce(new Error('Slot taken'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const session = createSession({
        currentStep: 'confirm',
        context: { selectedServiceId: 'svc-1', selectedTimeSlot: '2026-02-20T14:00:00Z' },
      })
      await engine.handleMessage({ session, messageBody: '1' })
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('Slot no longer available'),
      })
      consoleSpy.mockRestore()
    })
  })

  describe('completed step', () => {
    it('should restart from welcome menu', async () => {
      const session = createSession({ currentStep: 'completed' })
      await engine.handleMessage({ session, messageBody: 'hi' })
      expect(sessionRepo.update).toHaveBeenCalledWith('session-1', expect.objectContaining({ currentStep: 'welcome' }))
      expect(whatsAppService.sendText).toHaveBeenCalledWith({
        to: PHONE,
        body: expect.stringContaining('Schedulizer'),
      })
    })
  })
})
