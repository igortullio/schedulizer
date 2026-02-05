import { describe, expect, it } from 'vitest'
import enCommon from '../../public/locales/en/common.json'
import ptBRCommon from '../../public/locales/pt-BR/common.json'

describe('Translation Files', () => {
  describe('JSON Structure Validation', () => {
    it('should have valid JSON syntax for en locale', () => {
      expect(enCommon).toBeDefined()
      expect(typeof enCommon).toBe('object')
    })

    it('should have valid JSON syntax for pt-BR locale', () => {
      expect(ptBRCommon).toBeDefined()
      expect(typeof ptBRCommon).toBe('object')
    })
  })

  describe('Key Consistency', () => {
    function getAllKeys(obj: Record<string, unknown>, prefix = ''): string[] {
      const keys: string[] = []
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        if (value && typeof value === 'object' && !Array.isArray(value)) {
          keys.push(...getAllKeys(value as Record<string, unknown>, fullKey))
        } else {
          keys.push(fullKey)
        }
      }
      return keys
    }

    it('should have all keys from en in pt-BR', () => {
      const enKeys = getAllKeys(enCommon as Record<string, unknown>)
      const ptBRKeys = getAllKeys(ptBRCommon as Record<string, unknown>)
      const missingKeys = enKeys.filter(key => !ptBRKeys.includes(key))
      expect(missingKeys).toEqual([])
    })

    it('should have all keys from pt-BR in en', () => {
      const enKeys = getAllKeys(enCommon as Record<string, unknown>)
      const ptBRKeys = getAllKeys(ptBRCommon as Record<string, unknown>)
      const missingKeys = ptBRKeys.filter(key => !enKeys.includes(key))
      expect(missingKeys).toEqual([])
    })

    it('should have identical key structure between locales', () => {
      const enKeys = getAllKeys(enCommon as Record<string, unknown>).sort()
      const ptBRKeys = getAllKeys(ptBRCommon as Record<string, unknown>).sort()
      expect(enKeys).toEqual(ptBRKeys)
    })
  })

  describe('Namespace Organization', () => {
    it('should have hero namespace', () => {
      expect(enCommon.hero).toBeDefined()
      expect(ptBRCommon.hero).toBeDefined()
    })

    it('should have benefits namespace', () => {
      expect(enCommon.benefits).toBeDefined()
      expect(ptBRCommon.benefits).toBeDefined()
    })

    it('should have pricing namespace', () => {
      expect(enCommon.pricing).toBeDefined()
      expect(ptBRCommon.pricing).toBeDefined()
    })

    it('should have footer namespace', () => {
      expect(enCommon.footer).toBeDefined()
      expect(ptBRCommon.footer).toBeDefined()
    })

    it('should have leadForm namespace', () => {
      expect(enCommon.leadForm).toBeDefined()
      expect(ptBRCommon.leadForm).toBeDefined()
    })
  })

  describe('Interpolation Placeholders', () => {
    function findInterpolations(obj: Record<string, unknown>, prefix = ''): Record<string, string[]> {
      const interpolations: Record<string, string[]> = {}
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        if (typeof value === 'string') {
          const matches = value.match(/{{(\w+)}}/g)
          if (matches) {
            interpolations[fullKey] = matches.map(m => m.replace(/{{|}}/g, ''))
          }
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          Object.assign(interpolations, findInterpolations(value as Record<string, unknown>, fullKey))
        }
      }
      return interpolations
    }

    it('should have matching interpolation placeholders between locales', () => {
      const enInterpolations = findInterpolations(enCommon as Record<string, unknown>)
      const ptBRInterpolations = findInterpolations(ptBRCommon as Record<string, unknown>)
      expect(Object.keys(enInterpolations).sort()).toEqual(Object.keys(ptBRInterpolations).sort())
      for (const key in enInterpolations) {
        expect(enInterpolations[key]).toEqual(ptBRInterpolations[key])
      }
    })

    it('should use correct interpolation format ({{variable}})', () => {
      const enCopyright = enCommon.footer.copyright
      const ptBRCopyright = ptBRCommon.footer.copyright
      expect(enCopyright).toMatch(/{{year}}/)
      expect(ptBRCopyright).toMatch(/{{year}}/)
    })
  })

  describe('Array Structure Consistency', () => {
    it('should have same number of benefit items in both locales', () => {
      expect(enCommon.benefits.items).toHaveLength(4)
      expect(ptBRCommon.benefits.items).toHaveLength(4)
    })

    it('should have same structure for benefit items', () => {
      for (let i = 0; i < enCommon.benefits.items.length; i++) {
        expect(enCommon.benefits.items[i]).toHaveProperty('title')
        expect(enCommon.benefits.items[i]).toHaveProperty('description')
        expect(ptBRCommon.benefits.items[i]).toHaveProperty('title')
        expect(ptBRCommon.benefits.items[i]).toHaveProperty('description')
      }
    })

    it('should have same number of features for each pricing plan', () => {
      expect(enCommon.pricing.plans.essential.features).toHaveLength(5)
      expect(ptBRCommon.pricing.plans.essential.features).toHaveLength(5)
      expect(enCommon.pricing.plans.professional.features).toHaveLength(6)
      expect(ptBRCommon.pricing.plans.professional.features).toHaveLength(6)
    })
  })

  describe('No Empty Strings', () => {
    function findEmptyStrings(obj: Record<string, unknown>, prefix = ''): string[] {
      const emptyKeys: string[] = []
      for (const key in obj) {
        const fullKey = prefix ? `${prefix}.${key}` : key
        const value = obj[key]
        if (typeof value === 'string' && value.trim() === '') {
          emptyKeys.push(fullKey)
        } else if (value && typeof value === 'object' && !Array.isArray(value)) {
          emptyKeys.push(...findEmptyStrings(value as Record<string, unknown>, fullKey))
        } else if (Array.isArray(value)) {
          value.forEach((item, index) => {
            if (typeof item === 'string' && item.trim() === '') {
              emptyKeys.push(`${fullKey}[${index}]`)
            } else if (item && typeof item === 'object') {
              emptyKeys.push(...findEmptyStrings(item as Record<string, unknown>, `${fullKey}[${index}]`))
            }
          })
        }
      }
      return emptyKeys
    }

    it('should not have empty strings in en locale', () => {
      const emptyKeys = findEmptyStrings(enCommon as Record<string, unknown>)
      expect(emptyKeys).toEqual([])
    })

    it('should not have empty strings in pt-BR locale', () => {
      const emptyKeys = findEmptyStrings(ptBRCommon as Record<string, unknown>)
      expect(emptyKeys).toEqual([])
    })
  })

  describe('Translation Content Quality', () => {
    it('should have non-empty hero title in both locales', () => {
      expect(enCommon.hero.title).toBeTruthy()
      expect(ptBRCommon.hero.title).toBeTruthy()
    })

    it('should have non-empty CTA buttons in both locales', () => {
      expect(enCommon.hero.cta.primary).toBeTruthy()
      expect(enCommon.hero.cta.secondary).toBeTruthy()
      expect(ptBRCommon.hero.cta.primary).toBeTruthy()
      expect(ptBRCommon.hero.cta.secondary).toBeTruthy()
    })

    it('should have validation messages in both locales', () => {
      expect(enCommon.leadForm.validation.nameRequired).toBeTruthy()
      expect(enCommon.leadForm.validation.invalidEmail).toBeTruthy()
      expect(ptBRCommon.leadForm.validation.nameRequired).toBeTruthy()
      expect(ptBRCommon.leadForm.validation.invalidEmail).toBeTruthy()
    })
  })

  describe('Pricing Consistency', () => {
    it('should have both essential and professional plans in both locales', () => {
      expect(enCommon.pricing.plans.essential).toBeDefined()
      expect(enCommon.pricing.plans.professional).toBeDefined()
      expect(ptBRCommon.pricing.plans.essential).toBeDefined()
      expect(ptBRCommon.pricing.plans.professional).toBeDefined()
    })

    it('should have price and period for each plan', () => {
      expect(enCommon.pricing.plans.essential.price).toBeTruthy()
      expect(enCommon.pricing.plans.essential.period).toBeTruthy()
      expect(enCommon.pricing.plans.professional.price).toBeTruthy()
      expect(enCommon.pricing.plans.professional.period).toBeTruthy()
      expect(ptBRCommon.pricing.plans.essential.price).toBeTruthy()
      expect(ptBRCommon.pricing.plans.essential.period).toBeTruthy()
      expect(ptBRCommon.pricing.plans.professional.price).toBeTruthy()
      expect(ptBRCommon.pricing.plans.professional.period).toBeTruthy()
    })
  })

  describe('Footer Structure', () => {
    it('should have brand description in both locales', () => {
      expect(enCommon.footer.brandDescription).toBeTruthy()
      expect(ptBRCommon.footer.brandDescription).toBeTruthy()
    })

    it('should have links section with privacy and terms', () => {
      expect(enCommon.footer.sections.links.privacy).toBeTruthy()
      expect(enCommon.footer.sections.links.terms).toBeTruthy()
      expect(ptBRCommon.footer.sections.links.privacy).toBeTruthy()
      expect(ptBRCommon.footer.sections.links.terms).toBeTruthy()
    })

    it('should have copyright message with year placeholder', () => {
      expect(enCommon.footer.copyright).toContain('{{year}}')
      expect(ptBRCommon.footer.copyright).toContain('{{year}}')
    })
  })
})
