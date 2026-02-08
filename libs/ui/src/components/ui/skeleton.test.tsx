import { describe, expect, it } from 'vitest'
import { Skeleton } from './skeleton'

describe('Skeleton Component', () => {
  it('exports Skeleton component', () => {
    expect(Skeleton).toBeDefined()
    expect(typeof Skeleton).toBe('function')
  })
})
