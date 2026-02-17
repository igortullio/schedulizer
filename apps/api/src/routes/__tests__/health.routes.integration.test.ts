import type { Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: {
    databaseUrl: 'postgresql://test:test@localhost:5432/test',
  },
}))

const { mockExecute } = vi.hoisted(() => ({
  mockExecute: vi.fn(),
}))

vi.mock('@schedulizer/db', () => ({
  createDb: vi.fn(() => ({
    execute: mockExecute,
  })),
}))

vi.mock('drizzle-orm', () => ({
  sql: (strings: TemplateStringsArray) => strings.join(''),
}))

import { healthRoutes } from '../health.routes'

interface RouteLayer {
  route?: {
    path?: string
    methods?: { get?: boolean }
    stack?: Array<{ handle?: (req: Request, res: Response, next: () => void) => Promise<void> }>
  }
}

function findRouteHandler(router: unknown, method: 'get', path: string) {
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
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
}

describe('Health Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('GET /', () => {
    it('should have route registered', () => {
      const handler = findRouteHandler(healthRoutes, 'get', '/')
      expect(handler).toBeDefined()
    })

    it('should return healthy status when database is connected', async () => {
      mockExecute.mockResolvedValueOnce([{ '?column?': 1 }])
      const handler = findRouteHandler(healthRoutes, 'get', '/')
      const req = {} as Request
      const res = createMockRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'healthy',
          timestamp: expect.any(String),
          services: expect.objectContaining({
            database: 'connected',
            uptime: expect.stringMatching(/^\d+h \d+m$/),
          }),
        }),
      )
    })

    it('should return degraded status with HTTP 200 when database connection fails', async () => {
      mockExecute.mockRejectedValueOnce(new Error('Connection refused'))
      const handler = findRouteHandler(healthRoutes, 'get', '/')
      const req = {} as Request
      const res = createMockRes()
      await handler!(req, res, vi.fn())
      expect(res.status).toHaveBeenCalledWith(200)
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'degraded',
          timestamp: expect.any(String),
          services: expect.objectContaining({
            database: 'disconnected',
            uptime: expect.stringMatching(/^\d+h \d+m$/),
          }),
        }),
      )
    })

    it('should include valid ISO timestamp', async () => {
      mockExecute.mockResolvedValueOnce([{ '?column?': 1 }])
      const handler = findRouteHandler(healthRoutes, 'get', '/')
      const req = {} as Request
      const res = createMockRes()
      await handler!(req, res, vi.fn())
      const jsonCall = (res.json as ReturnType<typeof vi.fn>).mock.calls[0] as unknown[]
      const body = jsonCall[0] as { timestamp: string }
      expect(() => new Date(body.timestamp)).not.toThrow()
      expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp)
    })
  })
})
