import { beforeAll, describe, expect, it } from 'vitest'
import enAuth from '../../public/locales/en/auth.json'
import enCommon from '../../public/locales/en/common.json'
import ptBRAuth from '../../public/locales/pt-BR/auth.json'
import ptBRCommon from '../../public/locales/pt-BR/common.json'
import i18n from './i18n'

describe('i18n configuration', () => {
  beforeAll(async () => {
    if (!i18n.isInitialized) {
      await i18n.init()
    }
    i18n.addResourceBundle('en', 'auth', enAuth, true, true)
    i18n.addResourceBundle('en', 'common', enCommon, true, true)
    i18n.addResourceBundle('pt-BR', 'auth', ptBRAuth, true, true)
    i18n.addResourceBundle('pt-BR', 'common', ptBRCommon, true, true)
  })

  describe('initialization', () => {
    it('should initialize i18next instance successfully', () => {
      expect(i18n).toBeDefined()
      expect(i18n.isInitialized).toBeTruthy()
    })

    it('should export translation function', () => {
      expect(typeof i18n.t).toBe('function')
    })

    it('should export language change function', () => {
      expect(typeof i18n.changeLanguage).toBe('function')
    })

    it('should set fallback language to pt-BR', () => {
      const fallbackLng = i18n.options.fallbackLng
      if (Array.isArray(fallbackLng)) {
        expect(fallbackLng).toContain('pt-BR')
      } else {
        expect(fallbackLng).toBe('pt-BR')
      }
    })

    it('should configure supported languages', () => {
      expect(i18n.options.supportedLngs).toContain('pt-BR')
      expect(i18n.options.supportedLngs).toContain('en')
    })

    it('should configure auth and common namespaces', () => {
      const namespaces = i18n.options.ns
      expect(namespaces).toContain('auth')
      expect(namespaces).toContain('common')
    })

    it('should set auth as default namespace', () => {
      expect(i18n.options.defaultNS).toBe('auth')
    })
  })

  describe('language detection', () => {
    it('should configure localStorage as primary detection method', () => {
      const detectionOrder = i18n.options.detection?.order
      expect(detectionOrder?.[0]).toBe('localStorage')
    })

    it('should configure navigator as fallback detection method', () => {
      const detectionOrder = i18n.options.detection?.order
      expect(detectionOrder).toContain('navigator')
    })

    it('should configure localStorage as cache storage', () => {
      expect(i18n.options.detection?.caches).toContain('localStorage')
    })

    it('should use correct localStorage key', () => {
      expect(i18n.options.detection?.lookupLocalStorage).toBe('i18nextLng')
    })
  })

  describe('backend configuration', () => {
    it('should configure correct load path for translations', () => {
      expect((i18n.options.backend as { loadPath?: string })?.loadPath).toBe('/locales/{{lng}}/{{ns}}.json')
    })
  })

  describe('react configuration', () => {
    it('should enable react suspense', () => {
      expect(i18n.options.react?.useSuspense).toBe(true)
    })
  })

  describe('interpolation', () => {
    it('should disable escape value for react', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })
  })

  describe('language switching', () => {
    it('should support changing language to en', async () => {
      await i18n.changeLanguage('en')
      expect(i18n.language).toBe('en')
    })

    it('should support changing language to pt-BR', async () => {
      await i18n.changeLanguage('pt-BR')
      expect(i18n.language).toBe('pt-BR')
    })

    it('should cache language changes to localStorage', async () => {
      await i18n.changeLanguage('en')
      const cachedLng = localStorage.getItem('i18nextLng')
      expect(cachedLng).toMatch(/en/)
    })
  })

  describe('plugins', () => {
    it('should have modules registered', () => {
      expect(i18n.modules).toBeDefined()
      expect(i18n.modules.external?.length).toBeGreaterThan(0)
    })
  })
})
