import { CreateServiceSchema, UpdateServiceSchema } from '@schedulizer/shared-types'
import { describe, expect, it } from 'vitest'

describe('CreateServiceSchema', () => {
  it('should validate required fields', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Haircut',
      duration: 30,
      price: '50.00',
    })
    expect(result.success).toBe(true)
  })

  it('should reject empty name', () => {
    const result = CreateServiceSchema.safeParse({
      name: '',
      duration: 30,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject name exceeding 255 characters', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'a'.repeat(256),
      duration: 30,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject duration less than 5', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 4,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject duration greater than 480', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 481,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject non-integer duration', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30.5,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid price format (no decimal)', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid price format (one decimal place)', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50.0',
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid price format (three decimal places)', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50.000',
    })
    expect(result.success).toBe(false)
  })

  it('should accept valid price format', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '100.50',
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional description', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50.00',
      description: 'A test service',
    })
    expect(result.success).toBe(true)
  })

  it('should accept optional active field with default true', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50.00',
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(true)
    }
  })

  it('should accept active=false', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
      price: '50.00',
      active: false,
    })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.active).toBe(false)
    }
  })

  it('should reject missing name', () => {
    const result = CreateServiceSchema.safeParse({
      duration: 30,
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing duration', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      price: '50.00',
    })
    expect(result.success).toBe(false)
  })

  it('should reject missing price', () => {
    const result = CreateServiceSchema.safeParse({
      name: 'Test',
      duration: 30,
    })
    expect(result.success).toBe(false)
  })
})

describe('UpdateServiceSchema', () => {
  it('should allow partial updates (name only)', () => {
    const result = UpdateServiceSchema.safeParse({
      name: 'Updated Name',
    })
    expect(result.success).toBe(true)
  })

  it('should allow partial updates (price only)', () => {
    const result = UpdateServiceSchema.safeParse({
      price: '75.00',
    })
    expect(result.success).toBe(true)
  })

  it('should allow partial updates (duration only)', () => {
    const result = UpdateServiceSchema.safeParse({
      duration: 60,
    })
    expect(result.success).toBe(true)
  })

  it('should allow partial updates (active only)', () => {
    const result = UpdateServiceSchema.safeParse({
      active: false,
    })
    expect(result.success).toBe(true)
  })

  it('should allow empty object', () => {
    const result = UpdateServiceSchema.safeParse({})
    expect(result.success).toBe(true)
  })

  it('should reject invalid values for provided fields', () => {
    const result = UpdateServiceSchema.safeParse({
      duration: 3,
    })
    expect(result.success).toBe(false)
  })

  it('should reject invalid price format', () => {
    const result = UpdateServiceSchema.safeParse({
      price: 'invalid',
    })
    expect(result.success).toBe(false)
  })

  it('should allow multiple fields at once', () => {
    const result = UpdateServiceSchema.safeParse({
      name: 'New Name',
      duration: 45,
      price: '99.99',
      active: true,
    })
    expect(result.success).toBe(true)
  })
})
