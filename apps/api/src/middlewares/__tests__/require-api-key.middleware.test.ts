import type { NextFunction, Request, Response } from 'express'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mockEnv = vi.hoisted(() => ({
  cronApiKey: 'valid-api-key-12345678' as string | undefined,
}))

vi.mock('@schedulizer/env/server', () => ({
  serverEnv: mockEnv,
}))

import { requireApiKey } from '../require-api-key.middleware'

function createMockReqRes(headers: Record<string, string> = {}) {
  const req = {
    headers,
    originalUrl: '/api/notifications/send-reminders',
  } as unknown as Request
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
  } as unknown as Response
  const next = vi.fn() as NextFunction
  return { req, res, next }
}

describe('requireApiKey middleware', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockEnv.cronApiKey = 'valid-api-key-12345678'
  })

  it('should call next() with valid API key', () => {
    const { req, res, next } = createMockReqRes({ 'x-api-key': 'valid-api-key-12345678' })
    requireApiKey(req, res, next)
    expect(next).toHaveBeenCalled()
    expect(res.status).not.toHaveBeenCalled()
  })

  it('should return 401 with invalid API key', () => {
    const { req, res, next } = createMockReqRes({ 'x-api-key': 'wrong-key' })
    requireApiKey(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
    expect(res.json).toHaveBeenCalledWith({
      error: { message: 'Invalid API key', code: 'INVALID_API_KEY' },
    })
  })

  it('should return 401 without API key header', () => {
    const { req, res, next } = createMockReqRes({})
    requireApiKey(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(401)
  })

  it('should return 500 when CRON_API_KEY is not configured', () => {
    mockEnv.cronApiKey = undefined
    const { req, res, next } = createMockReqRes({ 'x-api-key': 'some-key' })
    requireApiKey(req, res, next)
    expect(next).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(500)
  })
})
