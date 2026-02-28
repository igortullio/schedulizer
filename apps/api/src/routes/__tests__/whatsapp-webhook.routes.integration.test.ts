import { createHmac } from 'node:crypto'
import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const { TEST_VERIFY_TOKEN, TEST_APP_SECRET } = vi.hoisted(() => ({
  TEST_VERIFY_TOKEN: 'test-verify-token',
  TEST_APP_SECRET: 'test-app-secret',
}))

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    whatsappPhoneNumberId: 'phone-123',
    whatsappAccessToken: 'token-123',
    whatsappVerifyToken: TEST_VERIFY_TOKEN,
    whatsappAppSecret: TEST_APP_SECRET,
  },
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(() => Promise.resolve([])),
        })),
        limit: vi.fn(() => Promise.resolve([])),
      })),
    })),
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() => Promise.resolve([{ id: 'session-1' }])),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(() => Promise.resolve([{}])),
        })),
      })),
    })),
    delete: vi.fn(() => ({
      where: vi.fn(() => Promise.resolve()),
    })),
    transaction: vi.fn(),
  })),
  schema: {
    whatsappSessions: {
      id: 'id',
      phoneNumber: 'phone_number',
      organizationId: 'organization_id',
      currentStep: 'current_step',
      context: 'context',
      updatedAt: 'updated_at',
    },
    services: {
      id: 'id',
      organizationId: 'organization_id',
      name: 'name',
      active: 'active',
      durationMinutes: 'duration_minutes',
    },
    appointments: {
      id: 'id',
      organizationId: 'organization_id',
      serviceId: 'service_id',
      startDatetime: 'start_datetime',
      endDatetime: 'end_datetime',
      status: 'status',
    },
    organizations: {
      id: 'id',
    },
  },
}))

vi.mock('@schedulizer/whatsapp', () => ({
  verifyWebhookSignature: vi.fn((rawBody: string, signature: string, secret: string) => {
    const { createHmac: hmac } = require('node:crypto')
    const expectedHash = hmac('sha256', secret).update(rawBody).digest('hex')
    return signature === `sha256=${expectedHash}`
  }),
  WhatsAppService: class {
    sendTemplate = vi.fn(() => Promise.resolve({ messageId: 'msg-1', success: true }))
    sendText = vi.fn(() => Promise.resolve({ messageId: 'msg-1', success: true }))
    markAsRead = vi.fn(() => Promise.resolve())
  },
  SessionRepository: class {
    findActiveByPhone = vi.fn(() => Promise.resolve(null))
    create = vi.fn(() =>
      Promise.resolve({
        id: 'session-1',
        phoneNumber: '',
        organizationId: '',
        currentStep: 'welcome',
        context: {},
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
    )
    update = vi.fn(() => Promise.resolve({}))
    deleteExpired = vi.fn(() => Promise.resolve())
  },
  ChatbotEngine: class {
    handleMessage = vi.fn(() => Promise.resolve())
  },
  WebhookHandler: class {
    process = vi.fn(() => Promise.resolve())
  },
}))

vi.mock('../../lib/slot-calculator', () => ({
  calculateAvailableSlots: vi.fn(() => Promise.resolve([])),
}))

vi.mock('drizzle-orm', () => ({
  and: vi.fn((...args: unknown[]) => args),
  eq: vi.fn((a: unknown, b: unknown) => [a, b]),
  gt: vi.fn((a: unknown, b: unknown) => [a, b]),
  lt: vi.fn((a: unknown, b: unknown) => [a, b]),
  ne: vi.fn((a: unknown, b: unknown) => [a, b]),
}))

import { whatsappWebhookRouter } from '../whatsapp-webhook.routes'

interface RouteLayer {
  route?: {
    path?: string
    methods?: { get?: boolean; post?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> | void }>
  }
}

function findRouteHandler(router: unknown, method: 'get' | 'post', path: string) {
  const routes = (router as { stack: RouteLayer[] }).stack
  const route = routes.find(r => {
    if (!r.route?.methods?.[method]) return false
    if (r.route.path !== path) return false
    return true
  })
  const stack = route?.route?.stack ?? []
  return stack[stack.length - 1]?.handle
}

function createMockRes() {
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  } as unknown as Response
  return res
}

function generateSignature(body: string, secret: string): string {
  const hash = createHmac('sha256', secret).update(body).digest('hex')
  return `sha256=${hash}`
}

describe('WhatsApp Webhook Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET / (Webhook Verification)', () => {
    it('should return challenge when verify token matches', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'get', '/')
      expect(handler).toBeDefined()
      const req = {
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': TEST_VERIFY_TOKEN,
          'hub.challenge': 'test-challenge-123',
        },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.send).toHaveBeenCalledWith('test-challenge-123')
    })

    it('should return 403 when verify token does not match', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'get', '/')
      const req = {
        query: {
          'hub.mode': 'subscribe',
          'hub.verify_token': 'wrong-token',
          'hub.challenge': 'test-challenge-123',
        },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(403)
      expect(res.json).toHaveBeenCalledWith({ error: 'Forbidden' })
    })

    it('should return 400 when query params are missing', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'get', '/')
      const req = { query: {} } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid query parameters' })
    })

    it('should return 400 when hub.mode is not subscribe', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'get', '/')
      const req = {
        query: {
          'hub.mode': 'unsubscribe',
          'hub.verify_token': TEST_VERIFY_TOKEN,
          'hub.challenge': 'test-challenge-123',
        },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(400)
    })
  })

  describe('POST / (Webhook Messages)', () => {
    it('should return 401 when signature header is missing', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'post', '/')
      expect(handler).toBeDefined()
      const req = {
        body: Buffer.from('{}'),
        headers: {},
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Missing signature' })
    })

    it('should return 401 when signature is invalid', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'post', '/')
      const body = JSON.stringify({ object: 'whatsapp_business_account', entry: [] })
      const req = {
        body: Buffer.from(body),
        headers: { 'x-hub-signature-256': 'sha256=invalid' },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(401)
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid signature' })
    })

    it('should return 200 and process payload when signature is valid', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'post', '/')
      const payload = { object: 'whatsapp_business_account', entry: [] }
      const body = JSON.stringify(payload)
      const signature = generateSignature(body, TEST_APP_SECRET)
      const req = {
        body: Buffer.from(body),
        headers: { 'x-hub-signature-256': signature },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: 'ok' })
    })

    it('should return 200 with message payload and process fire-and-forget', () => {
      const handler = findRouteHandler(whatsappWebhookRouter, 'post', '/')
      const payload = {
        object: 'whatsapp_business_account',
        entry: [
          {
            id: 'entry-1',
            changes: [
              {
                value: {
                  messaging_product: 'whatsapp',
                  metadata: { display_phone_number: '+5511999999999', phone_number_id: 'phone-123' },
                  messages: [
                    { from: '+5511888888888', id: 'msg-1', timestamp: '1234567890', type: 'text', text: { body: '1' } },
                  ],
                },
                field: 'messages',
              },
            ],
          },
        ],
      }
      const body = JSON.stringify(payload)
      const signature = generateSignature(body, TEST_APP_SECRET)
      const req = {
        body: Buffer.from(body),
        headers: { 'x-hub-signature-256': signature },
      } as unknown as Request
      const res = createMockRes()
      handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith({ data: 'ok' })
    })
  })
})
