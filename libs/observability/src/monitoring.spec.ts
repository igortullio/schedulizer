import * as Sentry from '@sentry/node'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { withMonitoring } from './monitoring'

vi.mock('@sentry/node', () => ({
  captureCheckIn: vi.fn(() => 'checkin-id-123'),
}))

describe('withMonitoring', () => {
  const monitorConfig = {
    monitorSlug: 'send-reminders',
    schedule: { type: 'crontab' as const, value: '*/15 * * * *' },
    checkinMargin: 5,
    maxRuntime: 10,
  }

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('performs checkin with in_progress status at start', async () => {
    await withMonitoring(monitorConfig, async () => 'done')
    expect(Sentry.captureCheckIn).toHaveBeenCalledWith(
      { monitorSlug: 'send-reminders', status: 'in_progress' },
      { schedule: monitorConfig.schedule, checkinMargin: 5, maxRuntime: 10 },
    )
  })

  it('performs checkout with ok status on success', async () => {
    await withMonitoring(monitorConfig, async () => 'done')
    expect(Sentry.captureCheckIn).toHaveBeenCalledWith({
      checkInId: 'checkin-id-123',
      monitorSlug: 'send-reminders',
      status: 'ok',
    })
  })

  it('returns handler result on success', async () => {
    const result = await withMonitoring(monitorConfig, async () => 'handler-result')
    expect(result).toBe('handler-result')
  })

  it('performs checkout with error status on failure', async () => {
    await expect(
      withMonitoring(monitorConfig, async () => {
        throw new Error('handler failed')
      }),
    ).rejects.toThrow('handler failed')
    expect(Sentry.captureCheckIn).toHaveBeenCalledWith({
      checkInId: 'checkin-id-123',
      monitorSlug: 'send-reminders',
      status: 'error',
    })
  })

  it('re-throws the original error', async () => {
    const originalError = new Error('original error')
    await expect(
      withMonitoring(monitorConfig, async () => {
        throw originalError
      }),
    ).rejects.toBe(originalError)
  })
})
