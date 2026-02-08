import 'i18next'

import auth from '../public/locales/pt-BR/auth.json'
import common from '../public/locales/pt-BR/common.json'

declare module 'i18next' {
  interface CustomTypeOptions {
    defaultNS: 'auth'
    resources: {
      auth: typeof auth
      common: typeof common
    }
    returnNull: false
  }
}
