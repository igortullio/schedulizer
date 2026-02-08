import { describe, expect, it } from 'vitest'
import { Badge, badgeVariants } from './badge'

describe('Badge Component', () => {
  it('exports Badge component', () => {
    expect(Badge).toBeDefined()
    expect(typeof Badge).toBe('function')
  })

  it('exports badgeVariants', () => {
    expect(badgeVariants).toBeDefined()
    expect(typeof badgeVariants).toBe('function')
  })

  it('badgeVariants generates correct classes for default variant', () => {
    const classes = badgeVariants({ variant: 'default' })
    expect(classes).toContain('bg-primary')
  })

  it('badgeVariants generates correct classes for secondary variant', () => {
    const classes = badgeVariants({ variant: 'secondary' })
    expect(classes).toContain('bg-secondary')
  })

  it('badgeVariants generates correct classes for destructive variant', () => {
    const classes = badgeVariants({ variant: 'destructive' })
    expect(classes).toContain('bg-destructive')
  })

  it('badgeVariants generates correct classes for success variant', () => {
    const classes = badgeVariants({ variant: 'success' })
    expect(classes).toContain('bg-green-100')
  })

  it('badgeVariants generates correct classes for warning variant', () => {
    const classes = badgeVariants({ variant: 'warning' })
    expect(classes).toContain('bg-yellow-100')
  })

  it('badgeVariants generates correct classes for outline variant', () => {
    const classes = badgeVariants({ variant: 'outline' })
    expect(classes).toContain('text-foreground')
  })
})
