import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { createEmailLoginSchema, createNameSchema, createPhoneLoginSchema } from './login.schema'

const mockT = ((key: string) => key) as TFunction

describe('createEmailLoginSchema', () => {
  const schema = createEmailLoginSchema(mockT)

  it('accepts standard email format', () => {
    const result = schema.safeParse({ email: 'test@example.com' })
    expect(result.success).toBe(true)
  })

  it('accepts email with subdomain', () => {
    const result = schema.safeParse({ email: 'user@mail.example.com' })
    expect(result.success).toBe(true)
  })

  it('accepts email with plus sign', () => {
    const result = schema.safeParse({ email: 'user+tag@example.com' })
    expect(result.success).toBe(true)
  })

  it('rejects empty email', () => {
    const result = schema.safeParse({ email: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.emailRequired')
    }
  })

  it('rejects email without @ symbol', () => {
    const result = schema.safeParse({ email: 'testexample.com' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.invalidEmail')
    }
  })

  it('rejects email without domain', () => {
    const result = schema.safeParse({ email: 'test@' })
    expect(result.success).toBe(false)
  })

  it('rejects plain text', () => {
    const result = schema.safeParse({ email: 'notanemail' })
    expect(result.success).toBe(false)
  })

  it('rejects undefined email', () => {
    const result = schema.safeParse({})
    expect(result.success).toBe(false)
  })

  it('rejects null email', () => {
    const result = schema.safeParse({ email: null })
    expect(result.success).toBe(false)
  })

  it('rejects email that is only whitespace', () => {
    const result = schema.safeParse({ email: '   ' })
    expect(result.success).toBe(false)
  })
})

describe('createNameSchema', () => {
  const schema = createNameSchema(mockT)

  it('accepts valid name', () => {
    expect(schema.safeParse({ name: 'John Doe' }).success).toBe(true)
  })

  it('trims whitespace before validating', () => {
    const result = schema.safeParse({ name: '  Ana  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.data.name).toBe('Ana')
  })

  it('rejects empty name', () => {
    const result = schema.safeParse({ name: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameRequired')
  })

  it('rejects whitespace-only name', () => {
    const result = schema.safeParse({ name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameTooShort')
  })

  it('rejects name shorter than 2 characters after trim', () => {
    const result = schema.safeParse({ name: 'A' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues[0].message).toBe('validation.nameTooShort')
  })
})

describe('createPhoneLoginSchema', () => {
  const schema = createPhoneLoginSchema(mockT)

  it('accepts valid E.164 phone number', () => {
    const result = schema.safeParse({ phone: '+5511999999999' })
    expect(result.success).toBe(true)
  })

  it('accepts US phone number', () => {
    const result = schema.safeParse({ phone: '+12025551234' })
    expect(result.success).toBe(true)
  })

  it('rejects empty phone', () => {
    const result = schema.safeParse({ phone: '' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.phoneRequired')
    }
  })

  it('rejects phone without plus', () => {
    const result = schema.safeParse({ phone: '5511999999999' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.issues[0].message).toBe('validation.invalidPhone')
    }
  })

  it('rejects phone with letters', () => {
    const result = schema.safeParse({ phone: '+55abc' })
    expect(result.success).toBe(false)
  })
})
