import 'i18next'

import auth from '../public/locales/pt-BR/auth.json'
import billing from '../public/locales/pt-BR/billing.json'
import common from '../public/locales/pt-BR/common.json'
import schedules from '../public/locales/pt-BR/schedules.json'
import services from '../public/locales/pt-BR/services.json'
import timeBlocks from '../public/locales/pt-BR/timeBlocks.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'auth'
    resources: {
      auth: typeof auth
      billing: typeof billing
      common: typeof common
      schedules: typeof schedules
      services: typeof services
      timeBlocks: typeof timeBlocks
    }
    returnNull: false
  }
}
