import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

// Type for Express router stack layers
interface RouteLayer {
  route?: {
    methods?: { post?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
}

// Mock environment variables before importing modules
vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
    port: 3000,
    betterAuthSecret: 'test-secret',
    betterAuthUrl: 'http://localhost:3000',
    resendApiKey: 'test-key',
    turnstileSecretKey: 'test-turnstile',
  },
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(() =>
          Promise.resolve([
            {
              id: 'test-uuid',
              name: 'John Doe',
              email: 'john@example.com',
              phone: '+5511999999999',
              planInterest: 'essential',
              createdAt: new Date('2024-01-01T00:00:00Z'),
            },
          ]),
        ),
      })),
    })),
  })),
}))

vi.mock('@schedulizer/db/schema', () => ({
  leads: {},
}))

import * as leadsServiceModule from '../../services/leads.service'
import { leadsRoutes } from '../leads.routes'

// Helper to create mock req/res
function createMockReqRes(body: unknown) {
  const req = {
    body,
  } as Request

  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response

  return { req, res }
}

describe('Leads Routes Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should have POST route registered', () => {
    const routes = leadsRoutes.stack as RouteLayer[]
    const postRoute = routes.find(r => r.route?.methods?.post)
    expect(postRoute).toBeDefined()
  })

  it('should call leadsService.createLead with validated data', async () => {
    const mockLead = {
      id: 'test-uuid',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+5511999999999',
      planInterest: 'essential' as const,
      createdAt: new Date(),
    }

    const createLeadSpy = vi.spyOn(leadsServiceModule.leadsService, 'createLead').mockResolvedValue(mockLead)

    const { req, res } = createMockReqRes({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+5511999999999',
      planInterest: 'essential',
    })

    // Get the route handler
    const postRoute = (leadsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
    const handler = postRoute?.route?.stack?.[0]?.handle

    if (handler) {
      await handler(req, res, vi.fn())

      expect(createLeadSpy).toHaveBeenCalledWith({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        planInterest: 'essential',
      })

      expect(res.status).toHaveBeenCalledWith(201)
      expect(res.json).toHaveBeenCalledWith({
        data: {
          id: 'test-uuid',
          message: 'Lead cadastrado com sucesso',
        },
      })
    }
  })

  it('should return 400 for invalid data', async () => {
    const { req, res } = createMockReqRes({
      name: '',
      email: 'invalid-email',
      phone: 'abc',
      planInterest: 'invalid',
    })

    const postRoute = (leadsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
    const handler = postRoute?.route?.stack?.[0]?.handle

    if (handler) {
      await handler(req, res, vi.fn())

      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.any(String),
        }),
      )
    }
  })

  it('should return 500 on service error', async () => {
    vi.spyOn(leadsServiceModule.leadsService, 'createLead').mockRejectedValue(new Error('Database error'))

    const { req, res } = createMockReqRes({
      name: 'John Doe',
      email: 'john@example.com',
      phone: '+5511999999999',
      planInterest: 'essential',
    })

    const postRoute = (leadsRoutes.stack as RouteLayer[]).find(r => r.route?.methods?.post)
    const handler = postRoute?.route?.stack?.[0]?.handle

    if (handler) {
      await handler(req, res, vi.fn())

      expect(res.status).toHaveBeenCalledWith(500)
      expect(res.json).toHaveBeenCalledWith({
        error: 'Erro ao cadastrar lead. Por favor, tente novamente.',
      })
    }
  })
})
