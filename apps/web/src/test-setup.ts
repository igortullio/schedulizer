import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

afterEach(() => {
  cleanup()
})

if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}
