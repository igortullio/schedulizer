import 'i18next'

import appointments from '../public/locales/pt-BR/appointments.json'
import auth from '../public/locales/pt-BR/auth.json'
import billing from '../public/locales/pt-BR/billing.json'
import booking from '../public/locales/pt-BR/booking.json'
import common from '../public/locales/pt-BR/common.json'
import invite from '../public/locales/pt-BR/invite.json'
import dashboard from '../public/locales/pt-BR/dashboard.json'
import members from '../public/locales/pt-BR/members.json'
import schedules from '../public/locales/pt-BR/schedules.json'
import services from '../public/locales/pt-BR/services.json'
import settings from '../public/locales/pt-BR/settings.json'
import timeBlocks from '../public/locales/pt-BR/timeBlocks.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'auth'
    resources: {
      appointments: typeof appointments
      auth: typeof auth
      billing: typeof billing
      booking: typeof booking
      common: typeof common
      dashboard: typeof dashboard
      invite: typeof invite
      members: typeof members
      schedules: typeof schedules
      services: typeof services
      settings: typeof settings
      timeBlocks: typeof timeBlocks
    }
    returnNull: false
  }
}
