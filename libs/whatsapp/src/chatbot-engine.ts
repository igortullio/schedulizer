import type { SessionRepository } from './session/session-repository'
import type { ChatbotContext, ChatbotSession, ChatbotStep } from './session/session-types'
import type { WhatsAppService } from './whatsapp-service'

export interface AvailableService {
  id: string
  name: string
}

export interface TimeSlot {
  startTime: string
  endTime: string
}

export interface AppointmentDeps {
  listServices(organizationId: string): Promise<AvailableService[]>
  listAvailableSlots(params: { serviceId: string; date: string; organizationId: string }): Promise<TimeSlot[]>
  createAppointment(params: {
    organizationId: string
    serviceId: string
    startTime: string
    customerPhone: string
  }): Promise<{ id: string }>
}

export interface ChatbotEngineDeps {
  sessionRepository: SessionRepository
  whatsAppService: WhatsAppService
  appointmentDeps: AppointmentDeps
}

interface HandleMessageParams {
  session: ChatbotSession
  messageBody: string
}

const MENU_OPTION_SCHEDULE = '1'
const DATE_REGEX = /^\d{2}\/\d{2}\/\d{4}$/

export class ChatbotEngine {
  private readonly sessionRepository: SessionRepository
  private readonly whatsAppService: WhatsAppService
  private readonly appointmentDeps: AppointmentDeps

  constructor(deps: ChatbotEngineDeps) {
    this.sessionRepository = deps.sessionRepository
    this.whatsAppService = deps.whatsAppService
    this.appointmentDeps = deps.appointmentDeps
  }

  async handleMessage(params: HandleMessageParams): Promise<void> {
    const { session, messageBody } = params
    const input = messageBody.trim()
    switch (session.currentStep) {
      case 'welcome':
        await this.handleWelcome(session, input)
        break
      case 'select_service':
        await this.handleSelectService(session, input)
        break
      case 'select_date':
        await this.handleSelectDate(session, input)
        break
      case 'select_time':
        await this.handleSelectTime(session, input)
        break
      case 'confirm':
        await this.handleConfirm(session, input)
        break
      case 'completed':
        await this.sendWelcomeMenu(session)
        break
    }
  }

  private async handleWelcome(session: ChatbotSession, input: string): Promise<void> {
    if (input !== MENU_OPTION_SCHEDULE) {
      await this.sendWelcomeMenu(session)
      return
    }
    const services = await this.appointmentDeps.listServices(session.organizationId)
    if (services.length === 0) {
      await this.sendReply(session.phoneNumber, 'No services available at the moment.')
      return
    }
    const serviceList = services.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
    await this.updateSessionAndReply(
      session,
      'select_service',
      { availableServices: services },
      `Select a service:\n${serviceList}`,
    )
  }

  private async handleSelectService(session: ChatbotSession, input: string): Promise<void> {
    const services = session.context.availableServices ?? []
    const index = Number.parseInt(input, 10) - 1
    if (Number.isNaN(index) || index < 0 || index >= services.length) {
      const serviceList = services.map((s, i) => `${i + 1}. ${s.name}`).join('\n')
      await this.sendReply(session.phoneNumber, `Invalid option. Select a service:\n${serviceList}`)
      return
    }
    const selected = services[index]
    await this.updateSessionAndReply(
      session,
      'select_date',
      { ...session.context, selectedServiceId: selected.id },
      'Enter the desired date (DD/MM/YYYY):',
    )
  }

  private async handleSelectDate(session: ChatbotSession, input: string): Promise<void> {
    if (!DATE_REGEX.test(input)) {
      await this.sendReply(session.phoneNumber, 'Invalid format. Enter the date as DD/MM/YYYY:')
      return
    }
    const [day, month, year] = input.split('/')
    const isoDate = `${year}-${month}-${day}`
    const slots = await this.appointmentDeps.listAvailableSlots({
      serviceId: session.context.selectedServiceId!,
      date: isoDate,
      organizationId: session.organizationId,
    })
    if (slots.length === 0) {
      await this.sendReply(session.phoneNumber, 'No available slots for this date. Try another date (DD/MM/YYYY):')
      return
    }
    const availableSlots = slots.map(s => s.startTime)
    const slotList = availableSlots.map((s, i) => `${i + 1}. ${formatTime(s)}`).join('\n')
    await this.updateSessionAndReply(
      session,
      'select_time',
      { ...session.context, selectedDate: isoDate, availableSlots },
      `Available times:\n${slotList}`,
    )
  }

  private async handleSelectTime(session: ChatbotSession, input: string): Promise<void> {
    const slots = session.context.availableSlots ?? []
    const index = Number.parseInt(input, 10) - 1
    if (Number.isNaN(index) || index < 0 || index >= slots.length) {
      const slotList = slots.map((s, i) => `${i + 1}. ${formatTime(s)}`).join('\n')
      await this.sendReply(session.phoneNumber, `Invalid option. Select a time:\n${slotList}`)
      return
    }
    const selectedSlot = slots[index]
    const serviceName =
      session.context.availableServices?.find(s => s.id === session.context.selectedServiceId)?.name ?? ''
    await this.updateSessionAndReply(
      session,
      'confirm',
      { ...session.context, selectedTimeSlot: selectedSlot },
      `Confirm your appointment:\nService: ${serviceName}\nDate: ${session.context.selectedDate}\nTime: ${formatTime(selectedSlot)}\n\n1. Confirm\n2. Cancel`,
    )
  }

  private async handleConfirm(session: ChatbotSession, input: string): Promise<void> {
    if (input === '2') {
      await this.updateSessionAndReply(session, 'welcome', {}, 'Appointment cancelled.')
      await this.sendWelcomeMenu(session)
      return
    }
    if (input !== '1') {
      await this.sendReply(session.phoneNumber, 'Type 1 to confirm or 2 to cancel.')
      return
    }
    try {
      const result = await this.appointmentDeps.createAppointment({
        organizationId: session.organizationId,
        serviceId: session.context.selectedServiceId!,
        startTime: session.context.selectedTimeSlot!,
        customerPhone: session.phoneNumber,
      })
      await this.updateSessionAndReply(
        session,
        'completed',
        { ...session.context },
        `Appointment confirmed! ID: ${result.id}`,
      )
    } catch (error) {
      console.error('Chatbot appointment creation failed', {
        sessionId: session.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      await this.sendReply(session.phoneNumber, 'Slot no longer available. Please try again.')
      await this.updateSessionAndReply(
        session,
        'select_date',
        {
          ...session.context,
          selectedTimeSlot: undefined,
          availableSlots: undefined,
        },
        'Enter the desired date (DD/MM/YYYY):',
      )
    }
  }

  private async sendWelcomeMenu(session: ChatbotSession): Promise<void> {
    await this.sessionRepository.update(session.id, { currentStep: 'welcome', context: {} })
    await this.sendReply(
      session.phoneNumber,
      'Welcome to Schedulizer! What would you like to do?\n\n1. Schedule an appointment',
    )
  }

  private async updateSessionAndReply(
    session: ChatbotSession,
    nextStep: ChatbotStep,
    context: ChatbotContext,
    message: string,
  ): Promise<void> {
    await this.sessionRepository.update(session.id, { currentStep: nextStep, context })
    await this.sendReply(session.phoneNumber, message)
  }

  private async sendReply(phoneNumber: string, body: string): Promise<void> {
    await this.whatsAppService.sendText({ to: phoneNumber, body })
  }
}

function formatTime(isoString: string): string {
  try {
    const date = new Date(isoString)
    const hours = date.getUTCHours().toString().padStart(2, '0')
    const minutes = date.getUTCMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  } catch {
    return isoString
  }
}
