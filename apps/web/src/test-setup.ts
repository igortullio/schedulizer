import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

vi.mock('i18next-http-backend', () => {
  const MockBackend = {
    type: 'backend',
    init: () => {},
    read: (_language: string, _namespace: string, callback: (err: null, data: Record<string, string>) => void) => {
      callback(null, {})
    },
  }
  return { default: MockBackend }
})

declare global {
  var IS_REACT_ACT_ENVIRONMENT: boolean
}

afterEach(() => {
  cleanup()
})

if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}
