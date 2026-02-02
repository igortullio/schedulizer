import { describe, expect, it } from 'vitest'
import { Pricing } from './pricing'

describe('Pricing Component', () => {
  it('should be defined', () => {
    expect(Pricing).toBeDefined()
    expect(typeof Pricing).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Pricing.name).toBe('Pricing')
  })
})
