export type ChatbotStep = 'welcome' | 'select_service' | 'select_date' | 'select_time' | 'confirm' | 'completed'

export interface ChatbotContext {
  selectedServiceId?: string
  selectedDate?: string
  selectedTimeSlot?: string
  availableServices?: Array<{ id: string; name: string }>
  availableSlots?: string[]
}

export interface ChatbotSession {
  id: string
  phoneNumber: string
  organizationId: string
  currentStep: ChatbotStep
  context: ChatbotContext
  createdAt: Date
  updatedAt: Date
}
