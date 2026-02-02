import { describe, expect, it } from 'vitest'
import { Footer } from './footer'

describe('Footer Component', () => {
  it('should be defined', () => {
    expect(Footer).toBeDefined()
    expect(typeof Footer).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Footer.name).toBe('Footer')
  })
})
