import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { WhatsAppService } from './whatsapp-service'

const mockFetch = vi.fn()

vi.stubGlobal('fetch', mockFetch)

function createService(): WhatsAppService {
  return new WhatsAppService({
    phoneNumberId: '123456789',
    accessToken: 'test_access_token',
    apiVersion: 'v21.0',
  })
}

function createSuccessResponse(messageId = 'wamid.test123'): Response {
  return new Response(
    JSON.stringify({
      messaging_product: 'whatsapp',
      contacts: [{ input: '+5511999999999', wa_id: '5511999999999' }],
      messages: [{ id: messageId }],
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } },
  )
}

describe('WhatsAppService', () => {
  let service: WhatsAppService

  beforeEach(() => {
    service = createService()
    mockFetch.mockReset()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('sendTemplate', () => {
    it('should send a template message with correct payload', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse())
      const result = await service.sendTemplate({
        to: '+5511999999999',
        templateName: 'appointment_confirmation',
        languageCode: 'pt_BR',
        components: [
          {
            type: 'body',
            parameters: [
              { type: 'text', text: 'João' },
              { type: 'text', text: 'Corte de Cabelo' },
              { type: 'text', text: '20/02/2026 14:00' },
            ],
          },
        ],
      })
      expect(result).toEqual({ messageId: 'wamid.test123', success: true })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://graph.facebook.com/v21.0/123456789/messages',
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: '+5511999999999',
            type: 'template',
            template: {
              name: 'appointment_confirmation',
              language: { code: 'pt_BR' },
              components: [
                {
                  type: 'body',
                  parameters: [
                    { type: 'text', text: 'João' },
                    { type: 'text', text: 'Corte de Cabelo' },
                    { type: 'text', text: '20/02/2026 14:00' },
                  ],
                },
              ],
            },
          }),
        }),
      )
    })

    it('should send template with empty components when none provided', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse())
      const result = await service.sendTemplate({
        to: '+5511999999999',
        templateName: 'appointment_confirmation',
        languageCode: 'pt_BR',
      })
      expect(result.success).toBe(true)
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody.template.components).toEqual([])
    })

    it('should return failure on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{"error":"bad request"}', { status: 400 }))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await service.sendTemplate({
        to: '+5511999999999',
        templateName: 'invalid_template',
        languageCode: 'pt_BR',
      })
      expect(result).toEqual({ messageId: '', success: false })
      expect(consoleSpy).toHaveBeenCalledWith('WhatsApp message failed', expect.objectContaining({ statusCode: 400 }))
      consoleSpy.mockRestore()
    })

    it('should return failure on network error', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await service.sendTemplate({
        to: '+5511999999999',
        templateName: 'appointment_confirmation',
        languageCode: 'pt_BR',
      })
      expect(result).toEqual({ messageId: '', success: false })
      expect(consoleSpy).toHaveBeenCalledWith('WhatsApp message failed', { error: 'Network error' })
      consoleSpy.mockRestore()
    })
  })

  describe('sendText', () => {
    it('should send a text message with correct payload', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse('wamid.text456'))
      const result = await service.sendText({
        to: '+5511999999999',
        body: 'Olá! Bem-vindo ao Schedulizer.',
      })
      expect(result).toEqual({ messageId: 'wamid.text456', success: true })
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody).toEqual({
        messaging_product: 'whatsapp',
        to: '+5511999999999',
        type: 'text',
        text: { body: 'Olá! Bem-vindo ao Schedulizer.' },
      })
    })

    it('should return failure on HTTP error', async () => {
      mockFetch.mockResolvedValueOnce(new Response('Unauthorized', { status: 401 }))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      const result = await service.sendText({ to: '+5511999999999', body: 'Test' })
      expect(result).toEqual({ messageId: '', success: false })
      consoleSpy.mockRestore()
    })
  })

  describe('markAsRead', () => {
    it('should call the API with correct payload', async () => {
      mockFetch.mockResolvedValueOnce(new Response('{}', { status: 200 }))
      await service.markAsRead('wamid.abc123')
      const callBody = JSON.parse(mockFetch.mock.calls[0][1].body)
      expect(callBody).toEqual({
        messaging_product: 'whatsapp',
        status: 'read',
        message_id: 'wamid.abc123',
      })
    })

    it('should not throw on failure', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      await expect(service.markAsRead('wamid.abc123')).resolves.not.toThrow()
      expect(consoleSpy).toHaveBeenCalledWith(
        'WhatsApp markAsRead failed',
        expect.objectContaining({ messageId: 'wamid.abc123' }),
      )
      consoleSpy.mockRestore()
    })
  })

  describe('headers', () => {
    it('should include Authorization and Content-Type headers', async () => {
      mockFetch.mockResolvedValueOnce(createSuccessResponse())
      await service.sendText({ to: '+5511999999999', body: 'Test' })
      const headers = mockFetch.mock.calls[0][1].headers
      expect(headers).toEqual({
        Authorization: 'Bearer test_access_token',
        'Content-Type': 'application/json',
      })
    })
  })
})
