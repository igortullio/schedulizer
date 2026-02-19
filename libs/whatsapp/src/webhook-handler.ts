import type { ChatbotEngine } from './chatbot-engine'
import type { SessionRepository } from './session/session-repository'
import type { InboundMessage, WebhookPayload } from './types'
import type { WhatsAppService } from './whatsapp-service'

export interface WebhookHandlerDeps {
  sessionRepository: SessionRepository
  chatbotEngine: ChatbotEngine
  whatsAppService: WhatsAppService
  defaultOrganizationId: string
}

export class WebhookHandler {
  private readonly sessionRepository: SessionRepository
  private readonly chatbotEngine: ChatbotEngine
  private readonly whatsAppService: WhatsAppService
  private readonly defaultOrganizationId: string

  constructor(deps: WebhookHandlerDeps) {
    this.sessionRepository = deps.sessionRepository
    this.chatbotEngine = deps.chatbotEngine
    this.whatsAppService = deps.whatsAppService
    this.defaultOrganizationId = deps.defaultOrganizationId
  }

  async process(payload: WebhookPayload): Promise<void> {
    const messages = this.extractMessages(payload)
    const statuses = this.extractStatuses(payload)
    if (messages.length > 0) {
      console.log('WhatsApp webhook received', { messageCount: messages.length })
    }
    for (const status of statuses) {
      console.log('WhatsApp delivery status', {
        messageId: status.id,
        status: status.status,
      })
    }
    for (const message of messages) {
      await this.handleInboundMessage(message)
    }
  }

  private async handleInboundMessage(message: InboundMessage): Promise<void> {
    const messageBody = this.extractMessageBody(message)
    if (!messageBody) return
    try {
      await this.whatsAppService.markAsRead(message.id)
      let session = await this.sessionRepository.findActiveByPhone(message.from, this.defaultOrganizationId)
      if (!session) {
        session = await this.sessionRepository.create({
          phoneNumber: message.from,
          organizationId: this.defaultOrganizationId,
        })
        console.log('Chatbot session created', {
          sessionId: session.id,
          step: 'welcome',
        })
      }
      await this.chatbotEngine.handleMessage({ session, messageBody })
    } catch (error) {
      console.error('Chatbot message handling failed', {
        messageId: message.id,
        from: message.from,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  private extractMessageBody(message: InboundMessage): string | null {
    if (message.type === 'text' && message.text?.body) {
      return message.text.body
    }
    if (message.type === 'interactive' && message.interactive?.button_reply?.title) {
      return message.interactive.button_reply.title
    }
    return null
  }

  private extractMessages(payload: WebhookPayload): InboundMessage[] {
    const messages: InboundMessage[] = []
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.messages) {
          messages.push(...change.value.messages)
        }
      }
    }
    return messages
  }

  private extractStatuses(payload: WebhookPayload) {
    const statuses: Array<{ id: string; status: string }> = []
    for (const entry of payload.entry) {
      for (const change of entry.changes) {
        if (change.value.statuses) {
          for (const status of change.value.statuses) {
            statuses.push({ id: status.id, status: status.status })
          }
        }
      }
    }
    return statuses
  }
}
