import { describe, expect, it } from 'vitest'
import { Button, buttonVariants } from './button'

describe('Button Component', () => {
  it('exports Button component', () => {
    expect(Button).toBeDefined()
    expect(typeof Button).toBe('object')
  })

  it('exports buttonVariants', () => {
    expect(buttonVariants).toBeDefined()
    expect(typeof buttonVariants).toBe('function')
  })

  it('buttonVariants generates correct classes for default variant', () => {
    const classes = buttonVariants({ variant: 'default' })
    expect(classes).toContain('bg-primary')
  })

  it('buttonVariants generates correct classes for destructive variant', () => {
    const classes = buttonVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
  })

  it('buttonVariants generates correct classes for different sizes', () => {
    const small = buttonVariants({ size: 'sm' })
    const large = buttonVariants({ size: 'lg' })
    expect(small).toContain('h-9')
    expect(large).toContain('h-11')
  })
})
