import { describe, expect, it } from 'vitest'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './dialog'

describe('Dialog Component', () => {
  it('exports Dialog component', () => {
    expect(Dialog).toBeDefined()
  })

  it('exports DialogTrigger component', () => {
    expect(DialogTrigger).toBeDefined()
  })

  it('exports DialogContent component', () => {
    expect(DialogContent).toBeDefined()
    expect(typeof DialogContent).toBe('object')
  })

  it('exports DialogHeader component', () => {
    expect(DialogHeader).toBeDefined()
    expect(typeof DialogHeader).toBe('function')
  })

  it('exports DialogFooter component', () => {
    expect(DialogFooter).toBeDefined()
    expect(typeof DialogFooter).toBe('function')
  })

  it('exports DialogTitle component', () => {
    expect(DialogTitle).toBeDefined()
    expect(typeof DialogTitle).toBe('object')
  })

  it('exports DialogDescription component', () => {
    expect(DialogDescription).toBeDefined()
    expect(typeof DialogDescription).toBe('object')
  })
})
