import 'i18next'

import auth from '../public/locales/pt-BR/auth.json'
import billing from '../public/locales/pt-BR/billing.json'
import common from '../public/locales/pt-BR/common.json'
import services from '../public/locales/pt-BR/services.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'auth'
    resources: {
      auth: typeof auth
      billing: typeof billing
      common: typeof common
      services: typeof services
    }
    returnNull: false
  }
}
