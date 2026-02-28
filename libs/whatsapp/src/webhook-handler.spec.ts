import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChatbotEngine } from './chatbot-engine'
import type { SessionRepository } from './session/session-repository'
import type { WebhookPayload } from './types'
import { WebhookHandler } from './webhook-handler'
import type { WhatsAppService } from './whatsapp-service'

const PHONE = '+5511999999999'
const ORG_ID = 'org-default'

function createMockSession() {
  return {
    id: 'session-1',
    phoneNumber: PHONE,
    organizationId: ORG_ID,
    currentStep: 'welcome' as const,
    context: {},
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

function createMockDeps() {
  const sessionRepository = {
    findActiveByPhone: vi.fn(),
    create: vi.fn().mockResolvedValue(createMockSession()),
    update: vi.fn(),
    deleteExpired: vi.fn(),
  } as unknown as SessionRepository
  const chatbotEngine = {
    handleMessage: vi.fn(),
  } as unknown as ChatbotEngine
  const whatsAppService = {
    sendText: vi.fn().mockResolvedValue({ messageId: 'wamid.test', success: true }),
    sendTemplate: vi.fn(),
    markAsRead: vi.fn().mockResolvedValue(undefined),
  } as unknown as WhatsAppService
  return { sessionRepository, chatbotEngine, whatsAppService, defaultOrganizationId: ORG_ID }
}

function createPayload(messages?: WebhookPayload['entry'][0]['changes'][0]['value']['messages']): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-1',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+551133334444', phone_number_id: 'pn-1' },
              messages,
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

function createStatusPayload(): WebhookPayload {
  return {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'entry-1',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: { display_phone_number: '+551133334444', phone_number_id: 'pn-1' },
              statuses: [{ id: 'wamid.123', status: 'delivered', timestamp: '1234567890', recipient_id: PHONE }],
            },
            field: 'messages',
          },
        ],
      },
    ],
  }
}

describe('WebhookHandler', () => {
  let handler: WebhookHandler
  let deps: ReturnType<typeof createMockDeps>

  beforeEach(() => {
    deps = createMockDeps()
    handler = new WebhookHandler(deps)
  })

  describe('process', () => {
    it('should process text messages and create session if none exists', async () => {
      vi.mocked(deps.sessionRepository.findActiveByPhone).mockResolvedValueOnce(null)
      const payload = createPayload([
        { from: PHONE, id: 'msg-1', timestamp: '1234567890', type: 'text', text: { body: 'Hello' } },
      ])
      await handler.process(payload)
      expect(deps.whatsAppService.markAsRead).toHaveBeenCalledWith('msg-1')
      expect(deps.sessionRepository.create).toHaveBeenCalledWith({
        phoneNumber: PHONE,
        organizationId: ORG_ID,
      })
      expect(deps.chatbotEngine.handleMessage).toHaveBeenCalledWith({
        session: expect.objectContaining({ phoneNumber: PHONE }),
        messageBody: 'Hello',
      })
    })

    it('should use existing session when found', async () => {
      const existingSession = createMockSession()
      vi.mocked(deps.sessionRepository.findActiveByPhone).mockResolvedValueOnce(existingSession)
      const payload = createPayload([
        { from: PHONE, id: 'msg-2', timestamp: '1234567890', type: 'text', text: { body: '1' } },
      ])
      await handler.process(payload)
      expect(deps.sessionRepository.create).not.toHaveBeenCalled()
      expect(deps.chatbotEngine.handleMessage).toHaveBeenCalledWith({
        session: existingSession,
        messageBody: '1',
      })
    })

    it('should handle interactive button reply messages', async () => {
      vi.mocked(deps.sessionRepository.findActiveByPhone).mockResolvedValueOnce(createMockSession())
      const payload = createPayload([
        {
          from: PHONE,
          id: 'msg-3',
          timestamp: '1234567890',
          type: 'interactive',
          interactive: { type: 'button_reply', button_reply: { id: 'btn-1', title: 'Confirm' } },
        },
      ])
      await handler.process(payload)
      expect(deps.chatbotEngine.handleMessage).toHaveBeenCalledWith({
        session: expect.anything(),
        messageBody: 'Confirm',
      })
    })

    it('should skip messages without extractable body', async () => {
      const payload = createPayload([{ from: PHONE, id: 'msg-4', timestamp: '1234567890', type: 'button' }])
      await handler.process(payload)
      expect(deps.chatbotEngine.handleMessage).not.toHaveBeenCalled()
    })

    it('should log delivery statuses', async () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const payload = createStatusPayload()
      await handler.process(payload)
      expect(consoleSpy).toHaveBeenCalledWith('WhatsApp delivery status', {
        messageId: 'wamid.123',
        status: 'delivered',
      })
      consoleSpy.mockRestore()
    })

    it('should handle empty payload gracefully', async () => {
      const payload: WebhookPayload = { object: 'whatsapp_business_account', entry: [] }
      await handler.process(payload)
      expect(deps.chatbotEngine.handleMessage).not.toHaveBeenCalled()
    })

    it('should handle errors in message processing without throwing', async () => {
      vi.mocked(deps.sessionRepository.findActiveByPhone).mockRejectedValueOnce(new Error('DB error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const payload = createPayload([
        { from: PHONE, id: 'msg-5', timestamp: '1234567890', type: 'text', text: { body: 'Hello' } },
      ])
      await handler.process(payload)
      expect(consoleSpy).toHaveBeenCalledWith(
        'Chatbot message handling failed',
        expect.objectContaining({
          messageId: 'msg-5',
        }),
      )
      consoleSpy.mockRestore()
    })
  })
})
