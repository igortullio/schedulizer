import type {
  SendMessageResult,
  SendTemplateParams,
  SendTextParams,
  WhatsAppApiResponse,
  WhatsAppServiceConfig,
} from './types'

const REQUEST_TIMEOUT_MS = 10_000

export class WhatsAppService {
  private readonly baseUrl: string
  private readonly accessToken: string

  constructor(config: WhatsAppServiceConfig) {
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion}/${config.phoneNumberId}`
    this.accessToken = config.accessToken
  }

  async sendTemplate(params: SendTemplateParams): Promise<SendMessageResult> {
    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'template',
      template: {
        name: params.templateName,
        language: { code: params.languageCode },
        components: params.components ?? [],
      },
    }
    return this.sendMessage(body)
  }

  async sendText(params: SendTextParams): Promise<SendMessageResult> {
    const body = {
      messaging_product: 'whatsapp',
      to: params.to,
      type: 'text',
      text: { body: params.body },
    }
    return this.sendMessage(body)
  }

  async markAsRead(messageId: string): Promise<void> {
    const body = {
      messaging_product: 'whatsapp',
      status: 'read',
      message_id: messageId,
    }
    try {
      await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
    } catch (error) {
      console.error('WhatsApp markAsRead failed', {
        messageId,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  private async sendMessage(body: Record<string, unknown>): Promise<SendMessageResult> {
    try {
      const response = await fetch(`${this.baseUrl}/messages`, {
        method: 'POST',
        headers: this.buildHeaders(),
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      })
      if (!response.ok) {
        const errorBody = await response.text()
        console.error('WhatsApp message failed', {
          statusCode: response.status,
          error: errorBody,
        })
        return { messageId: '', success: false }
      }
      const data = (await response.json()) as WhatsAppApiResponse
      const messageId = data.messages[0]?.id ?? ''
      console.log('WhatsApp message sent', { messageId })
      return { messageId, success: true }
    } catch (error) {
      console.error('WhatsApp message failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
      return { messageId: '', success: false }
    }
  }

  private buildHeaders(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.accessToken}`,
      'Content-Type': 'application/json',
    }
  }
}
