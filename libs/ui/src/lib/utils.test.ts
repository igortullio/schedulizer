import { describe, expect, it } from 'vitest'
import { cn } from './utils'

describe('cn utility function', () => {
  it('merges classes correctly', () => {
    const result = cn('text-red-500', 'text-blue-500')
    expect(result).toBe('text-blue-500')
  })

  it('handles conditional classes', () => {
    const result = cn('base-class', true && 'conditional-class', false && 'hidden')
    expect(result).toContain('base-class')
    expect(result).toContain('conditional-class')
    expect(result).not.toContain('hidden')
  })

  it('handles Tailwind conflicting classes', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles empty inputs', () => {
    const result = cn()
    expect(result).toBe('')
  })

  it('handles undefined and null values', () => {
    const result = cn('text-base', undefined, null, 'font-bold')
    expect(result).toContain('text-base')
    expect(result).toContain('font-bold')
  })
})
