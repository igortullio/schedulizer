import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// Ensure proper cleanup after each test
afterEach(() => {
  cleanup()
})

// Ensure act environment flag is set for React 19 compatibility
if (typeof globalThis !== 'undefined') {
  globalThis.IS_REACT_ACT_ENVIRONMENT = true
}
