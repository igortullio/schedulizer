import { PLAN_CONFIGS } from '@schedulizer/shared-types'
import type { NotificationChannel, ResolveChannelParams } from './notification-types'

export class ChannelResolver {
  resolve(params: ResolveChannelParams): NotificationChannel {
    if (!params.recipientPhone) return 'email'
    const planLimits = PLAN_CONFIGS[params.planType as keyof typeof PLAN_CONFIGS]
    if (!planLimits?.notifications.whatsapp) return 'email'
    return 'whatsapp'
  }
}
