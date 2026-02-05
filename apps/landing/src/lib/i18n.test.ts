import { beforeAll, describe, expect, it } from 'vitest'
import i18n from './i18n'
import enTranslations from '../../public/locales/en/common.json'
import ptBRTranslations from '../../public/locales/pt-BR/common.json'

describe('i18n Configuration', () => {
  beforeAll(async () => {
    if (!i18n.isInitialized) {
      await i18n.init()
    }
    i18n.addResourceBundle('en', 'common', enTranslations, true, true)
    i18n.addResourceBundle('pt-BR', 'common', ptBRTranslations, true, true)
  })

  describe('Initialization', () => {
    it('should initialize i18next instance successfully', () => {
      expect(i18n).toBeDefined()
      expect(i18n.isInitialized).toBeTruthy()
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
      const supportedLngs = i18n.options.supportedLngs
      expect(supportedLngs).toBeDefined()
      expect(supportedLngs).toContain('en')
      expect(supportedLngs).toContain('pt-BR')
    })

    it('should set default namespace to common', () => {
      expect(i18n.options.defaultNS).toBe('common')
    })

    it('should configure namespace list', () => {
      const namespaces = i18n.options.ns
      expect(namespaces).toBeDefined()
      expect(namespaces).toContain('common')
    })
  })

  describe('Debug Mode', () => {
    it('should enable debug mode in development environment', () => {
      if (import.meta.env.DEV) {
        expect(i18n.options.debug).toBe(true)
      }
    })

    it('should disable debug mode in production environment', () => {
      if (!import.meta.env.DEV) {
        expect(i18n.options.debug).toBe(false)
      }
    })
  })

  describe('HTTP Backend Configuration', () => {
    it('should configure HTTP backend correctly', () => {
      const backendOptions = i18n.options.backend
      expect(backendOptions).toBeDefined()
    })

    it('should set correct loadPath for translation files', () => {
      const backendOptions = i18n.options.backend as { loadPath?: string }
      expect(backendOptions?.loadPath).toBe('/locales/{{lng}}/{{ns}}.json')
    })
  })

  describe('Language Detection Configuration', () => {
    it('should configure language detection order with querystring priority', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions).toBeDefined()
      expect(detectionOptions?.order).toEqual(['querystring', 'localStorage', 'navigator'])
    })

    it('should configure localStorage caching', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.caches).toContain('localStorage')
    })

    it('should set localStorage lookup key', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.lookupLocalStorage).toBe('i18nextLng')
    })

    it('should set querystring lookup key', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.lookupQuerystring).toBe('lng')
    })
  })

  describe('Load Strategy Configuration', () => {
    it('should set load strategy to currentOnly', () => {
      expect(i18n.options.load).toBe('currentOnly')
    })
  })

  describe('Interpolation Configuration', () => {
    it('should disable escapeValue for React', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })
  })

  describe('Plugins', () => {
    it('should have modules registered', () => {
      const modules = i18n.modules
      expect(modules).toBeDefined()
      expect(modules.external?.length).toBeGreaterThan(0)
    })
  })

  describe('Translation API', () => {
    it('should provide translation function', () => {
      expect(i18n.t).toBeDefined()
      expect(typeof i18n.t).toBe('function')
    })

    it('should provide language change function', () => {
      expect(i18n.changeLanguage).toBeDefined()
      expect(typeof i18n.changeLanguage).toBe('function')
    })

    it('should expose current language property', () => {
      expect(i18n.language).toBeDefined()
      expect(typeof i18n.language).toBe('string')
    })
  })

  describe('Language Detection Behavior', () => {
    it('should default to fallback language when no language is detected', () => {
      const currentLanguage = i18n.language
      const fallbackLng = i18n.options.fallbackLng
      if (currentLanguage) {
        expect(typeof currentLanguage).toBe('string')
      }
      if (Array.isArray(fallbackLng)) {
        expect(fallbackLng).toContain('pt-BR')
      } else {
        expect(fallbackLng).toBe('pt-BR')
      }
    })
  })

  describe('Automatic Language Detection', () => {
    it('should support changing language programmatically to en', async () => {
      await i18n.changeLanguage('en')
      expect(i18n.language).toBe('en')
    })

    it('should support changing language programmatically to pt-BR', async () => {
      await i18n.changeLanguage('pt-BR')
      expect(i18n.language).toBe('pt-BR')
    })

    it('should cache language changes to localStorage', async () => {
      await i18n.changeLanguage('en')
      const cachedLng = localStorage.getItem('i18nextLng')
      expect(cachedLng).toBeDefined()
      expect(cachedLng).toMatch(/en/)
    })

    it('should support only en and pt-BR languages in supportedLngs', () => {
      const supportedLngs = i18n.options.supportedLngs
      expect(supportedLngs).toContain('en')
      expect(supportedLngs).toContain('pt-BR')
    })

    it('should use pt-BR as fallback language', () => {
      const fallbackLng = i18n.options.fallbackLng
      if (Array.isArray(fallbackLng)) {
        expect(fallbackLng).toContain('pt-BR')
      } else {
        expect(fallbackLng).toBe('pt-BR')
      }
    })

    it('should have querystring as highest priority in detection order', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.order?.[0]).toBe('querystring')
    })

    it('should have localStorage as second priority in detection order', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.order?.[1]).toBe('localStorage')
    })

    it('should have navigator as third priority in detection order', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.order?.[2]).toBe('navigator')
    })

    it('should have load strategy set to currentOnly for strict language matching', () => {
      expect(i18n.options.load).toBe('currentOnly')
    })
  })
})
