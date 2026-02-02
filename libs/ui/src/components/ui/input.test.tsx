import { describe, expect, it } from 'vitest'
import { Input } from './input'

describe('Input Component', () => {
  it('exports Input component', () => {
    expect(Input).toBeDefined()
    expect(typeof Input).toBe('object')
  })

  it('Input has correct displayName', () => {
    expect(Input.displayName).toBe('Input')
  })
})
