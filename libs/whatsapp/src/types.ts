export interface WhatsAppServiceConfig {
  phoneNumberId: string
  accessToken: string
  apiVersion: string
}

export interface SendTemplateParams {
  to: string
  templateName: string
  languageCode: string
  components?: TemplateComponent[]
}

export interface SendTextParams {
  to: string
  body: string
}

export interface SendMessageResult {
  messageId: string
  success: boolean
}

export interface TemplateBodyComponent {
  type: 'header' | 'body'
  parameters: TemplateTextParameter[]
}

export interface TemplateButtonComponent {
  type: 'button'
  sub_type: 'url' | 'copy_code'
  index: number
  parameters: TemplateParameter[]
}

export type TemplateComponent = TemplateBodyComponent | TemplateButtonComponent

export interface TemplateTextParameter {
  type: 'text'
  text: string
}

export interface TemplateCouponParameter {
  type: 'coupon_code'
  coupon_code: string
}

export type TemplateParameter = TemplateTextParameter | TemplateCouponParameter

export interface WhatsAppApiResponse {
  messaging_product: string
  contacts: Array<{ input: string; wa_id: string }>
  messages: Array<{ id: string }>
}

export interface WhatsAppApiError {
  error: {
    message: string
    type: string
    code: number
    fbtrace_id: string
  }
}

export interface WebhookPayload {
  object: 'whatsapp_business_account'
  entry: WebhookEntry[]
}

export interface WebhookEntry {
  id: string
  changes: WebhookChange[]
}

export interface WebhookChange {
  value: WebhookChangeValue
  field: 'messages'
}

export interface WebhookChangeValue {
  messaging_product: 'whatsapp'
  metadata: WebhookMetadata
  messages?: InboundMessage[]
  statuses?: MessageStatus[]
}

export interface WebhookMetadata {
  display_phone_number: string
  phone_number_id: string
}

export interface InboundMessage {
  from: string
  id: string
  timestamp: string
  type: 'text' | 'interactive' | 'button'
  text?: { body: string }
  interactive?: {
    type: string
    button_reply?: { id: string; title: string }
  }
}

export interface MessageStatus {
  id: string
  status: 'sent' | 'delivered' | 'read' | 'failed'
  timestamp: string
  recipient_id: string
  errors?: Array<{ code: number; title: string }>
}
