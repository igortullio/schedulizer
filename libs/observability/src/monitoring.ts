import * as Sentry from '@sentry/node'

interface MonitorConfig {
  monitorSlug: string
  schedule: {
    type: 'crontab'
    value: string
  }
  checkinMargin?: number
  maxRuntime?: number
}

async function withMonitoring<T>(config: MonitorConfig, handler: () => Promise<T>): Promise<T> {
  const checkInId = Sentry.captureCheckIn(
    { monitorSlug: config.monitorSlug, status: 'in_progress' },
    {
      schedule: config.schedule,
      checkinMargin: config.checkinMargin,
      maxRuntime: config.maxRuntime,
    },
  )
  console.log('Sentry Crons checkin', { monitorSlug: config.monitorSlug, checkInId })
  try {
    const result = await handler()
    Sentry.captureCheckIn({ checkInId, monitorSlug: config.monitorSlug, status: 'ok' })
    return result
  } catch (error) {
    Sentry.captureCheckIn({ checkInId, monitorSlug: config.monitorSlug, status: 'error' })
    throw error
  }
}

export type { MonitorConfig }
export { withMonitoring }
