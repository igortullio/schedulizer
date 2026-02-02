import { describe, expect, it } from 'vitest'
import { Hero } from './hero'

describe('Hero Component', () => {
  it('should be defined', () => {
    expect(Hero).toBeDefined()
    expect(typeof Hero).toBe('function')
  })

  it('should be a valid React component', () => {
    expect(Hero.name).toBe('Hero')
  })
})
