import { describe, expect, it, vi } from 'vitest'

// Mock clientEnv before importing App
vi.mock('@schedulizer/env/client', () => ({
  clientEnv: {
    apiUrl: 'http://localhost:3000',
  },
}))

import App from './app'

// Configuration tests for landing app setup
// DOM rendering tests will be implemented during landing page implementation phase

describe('App', () => {
  it('should be a function component', () => {
    expect(typeof App).toBe('function')
  })

  it('should export default', () => {
    expect(App).toBeDefined()
  })

  it('should have correct component name', () => {
    expect(App.name).toBe('App')
  })
})
