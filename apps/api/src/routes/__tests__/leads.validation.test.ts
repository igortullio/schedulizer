import { describe, expect, it } from 'vitest'
import { createLeadSchema } from '../../lib/validation/leads.validation'

describe('Lead Validation Schema', () => {
  describe('Valid Data', () => {
    it('should accept valid lead data with essential plan', () => {
      const validData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept valid lead data with professional plan', () => {
      const validData = {
        name: 'Jane Smith',
        email: 'jane@company.com',
        phone: '(11) 98888-8888',
        planInterest: 'professional',
      }

      const result = createLeadSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept phone with various formats', () => {
      const formats = ['+5511999999999', '11999999999', '(11) 99999-9999', '+55 11 99999-9999', '11 9 9999-9999']

      for (const phone of formats) {
        const result = createLeadSchema.safeParse({
          name: 'Test User',
          email: 'test@example.com',
          phone,
          planInterest: 'essential',
        })
        expect(result.success).toBe(true)
      }
    })
  })

  describe('Invalid Email', () => {
    it('should reject invalid email format', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'invalid-email',
        phone: '+5511999999999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject email without @', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'johndoe.com',
        phone: '+5511999999999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Missing Required Fields', () => {
    it('should reject empty name', () => {
      const invalidData = {
        name: '',
        email: 'john@example.com',
        phone: '+5511999999999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing email', () => {
      const invalidData = {
        name: 'John Doe',
        phone: '+5511999999999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty phone', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject missing planInterest', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Plan Interest', () => {
    it('should reject invalid planInterest value', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+5511999999999',
        planInterest: 'premium',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('Invalid Phone Format', () => {
    it('should reject phone with letters', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: 'abc123',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject phone with invalid special characters', () => {
      const invalidData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '11#9999*9999',
        planInterest: 'essential',
      }

      const result = createLeadSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
