import { describe, expect, it } from 'vitest'
import { z } from 'zod'

const setActiveOrgSchema = z.object({
  organizationId: z.string().uuid(),
})

describe('Organization Validation Schema', () => {
  describe('Valid Data', () => {
    it('should accept valid UUID organizationId', () => {
      const validData = {
        organizationId: '550e8400-e29b-41d4-a716-446655440000',
      }
      const result = setActiveOrgSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept valid random UUID organizationId', () => {
      const validData = {
        organizationId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      }
      const result = setActiveOrgSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('Invalid organizationId', () => {
    it('should reject missing organizationId', () => {
      const invalidData = {}
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject empty organizationId', () => {
      const invalidData = {
        organizationId: '',
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject non-UUID string organizationId', () => {
      const invalidData = {
        organizationId: 'not-a-uuid',
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject numeric organizationId', () => {
      const invalidData = {
        organizationId: 12345,
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject null organizationId', () => {
      const invalidData = {
        organizationId: null,
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject undefined organizationId', () => {
      const invalidData = {
        organizationId: undefined,
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject malformed UUID', () => {
      const invalidData = {
        organizationId: '550e8400-e29b-41d4-a716-44665544000', // Missing last digit
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject UUID with invalid characters', () => {
      const invalidData = {
        organizationId: '550e8400-e29b-41d4-a716-44665544000g', // Contains 'g'
      }
      const result = setActiveOrgSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })
})
