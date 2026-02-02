import { describe, expect, it } from 'vitest'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './card'

describe('Card Component', () => {
  it('exports Card component', () => {
    expect(Card).toBeDefined()
    expect(typeof Card).toBe('object')
  })

  it('exports CardHeader component', () => {
    expect(CardHeader).toBeDefined()
    expect(typeof CardHeader).toBe('object')
  })

  it('exports CardTitle component', () => {
    expect(CardTitle).toBeDefined()
    expect(typeof CardTitle).toBe('object')
  })

  it('exports CardDescription component', () => {
    expect(CardDescription).toBeDefined()
    expect(typeof CardDescription).toBe('object')
  })

  it('exports CardContent component', () => {
    expect(CardContent).toBeDefined()
    expect(typeof CardContent).toBe('object')
  })

  it('exports CardFooter component', () => {
    expect(CardFooter).toBeDefined()
    expect(typeof CardFooter).toBe('object')
  })

  it('all components have correct displayNames', () => {
    expect(Card.displayName).toBe('Card')
    expect(CardHeader.displayName).toBe('CardHeader')
    expect(CardTitle.displayName).toBe('CardTitle')
    expect(CardDescription.displayName).toBe('CardDescription')
    expect(CardContent.displayName).toBe('CardContent')
    expect(CardFooter.displayName).toBe('CardFooter')
  })
})
