import type { TFunction } from 'i18next'
import { describe, expect, it } from 'vitest'
import { createLoginSchema } from './login.schema'

const mockT = ((key: string) => key) as TFunction

const loginSchema = createLoginSchema(mockT)

describe('loginSchema', () => {
  describe('valid emails', () => {
    it('accepts standard email format', () => {
      const result = loginSchema.safeParse({ email: 'test@example.com' })
      expect(result.success).toBe(true)
    })

    it('accepts email with subdomain', () => {
      const result = loginSchema.safeParse({ email: 'user@mail.example.com' })
      expect(result.success).toBe(true)
    })

    it('accepts email with plus sign', () => {
      const result = loginSchema.safeParse({ email: 'user+tag@example.com' })
      expect(result.success).toBe(true)
    })

    it('accepts email with dots in local part', () => {
      const result = loginSchema.safeParse({ email: 'first.last@example.com' })
      expect(result.success).toBe(true)
    })

    it('accepts email with numbers', () => {
      const result = loginSchema.safeParse({ email: 'user123@example123.com' })
      expect(result.success).toBe(true)
    })

    it('accepts email with hyphens in domain', () => {
      const result = loginSchema.safeParse({ email: 'user@my-company.com' })
      expect(result.success).toBe(true)
    })
  })

  describe('invalid emails', () => {
    it('rejects empty email', () => {
      const result = loginSchema.safeParse({ email: '' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('validation.emailRequired')
      }
    })

    it('rejects email without @ symbol', () => {
      const result = loginSchema.safeParse({ email: 'testexample.com' })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('validation.invalidEmail')
      }
    })

    it('rejects email without domain', () => {
      const result = loginSchema.safeParse({ email: 'test@' })
      expect(result.success).toBe(false)
    })

    it('rejects email without local part', () => {
      const result = loginSchema.safeParse({ email: '@example.com' })
      expect(result.success).toBe(false)
    })

    it('rejects email with spaces', () => {
      const result = loginSchema.safeParse({ email: 'test @example.com' })
      expect(result.success).toBe(false)
    })

    it('rejects email without top-level domain', () => {
      const result = loginSchema.safeParse({ email: 'test@example' })
      expect(result.success).toBe(false)
    })

    it('rejects plain text', () => {
      const result = loginSchema.safeParse({ email: 'notanemail' })
      expect(result.success).toBe(false)
    })

    it('rejects email with multiple @ symbols', () => {
      const result = loginSchema.safeParse({ email: 'test@@example.com' })
      expect(result.success).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('rejects undefined email', () => {
      const result = loginSchema.safeParse({})
      expect(result.success).toBe(false)
    })

    it('rejects null email', () => {
      const result = loginSchema.safeParse({ email: null })
      expect(result.success).toBe(false)
    })

    it('rejects email that is only whitespace', () => {
      const result = loginSchema.safeParse({ email: '   ' })
      expect(result.success).toBe(false)
    })
  })
})
