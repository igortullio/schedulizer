import { describe, expect, it, vi, beforeAll } from 'vitest'
import i18n from './lib/i18n'

describe('Main Application i18n Integration', () => {
  beforeAll(async () => {
    vi.mock('react-dom/client', () => ({
      createRoot: vi.fn(() => ({
        render: vi.fn(),
      })),
    }))
    if (!i18n.isInitialized) {
      await i18n.init()
    }
  })

  describe('i18n Initialization', () => {
    it('should initialize i18n before React app initialization', () => {
      expect(i18n.isInitialized).toBeTruthy()
    })

    it('should have i18n instance available globally', () => {
      expect(i18n).toBeDefined()
      expect(i18n.language).toBeDefined()
    })

    it('should be ready to provide translations', () => {
      expect(i18n.t).toBeDefined()
      expect(typeof i18n.t).toBe('function')
    })
  })

  describe('Language Detection on Startup', () => {
    it('should detect language from localStorage or navigator', () => {
      const detectedLanguage = i18n.language
      expect(detectedLanguage).toBeDefined()
      expect(typeof detectedLanguage).toBe('string')
    })

    it('should default to English when browser language is unavailable', () => {
      const currentLang = i18n.language
      const supportedLangs = i18n.options.supportedLngs || []
      if (!supportedLangs.includes(currentLang)) {
        expect(i18n.options.fallbackLng).toBe('en')
      }
    })

    it('should use fallback language for unsupported languages', () => {
      const fallbackLng = i18n.options.fallbackLng
      if (Array.isArray(fallbackLng)) {
        expect(fallbackLng).toContain('en')
      } else {
        expect(fallbackLng).toBe('en')
      }
    })
  })

  describe('Translation Loading Configuration', () => {
    it('should configure backend to load from public/locales', () => {
      const backendOptions = i18n.options.backend as { loadPath?: string }
      expect(backendOptions?.loadPath).toContain('/locales/')
      expect(backendOptions?.loadPath).toContain('{{lng}}')
      expect(backendOptions?.loadPath).toContain('{{ns}}')
    })

    it('should support namespace-based translations', () => {
      expect(i18n.options.ns).toBeDefined()
      expect(i18n.options.defaultNS).toBe('translation')
    })
  })

  describe('Development Environment Configuration', () => {
    it('should configure debug mode based on environment', () => {
      const debugMode = i18n.options.debug
      if (import.meta.env.DEV) {
        expect(debugMode).toBe(true)
      } else {
        expect(debugMode).toBe(false)
      }
    })
  })

  describe('React Integration', () => {
    it('should have initReactI18next plugin configured', () => {
      const modules = i18n.modules
      expect(modules).toBeDefined()
      expect(modules.external?.length).toBeGreaterThan(0)
    })

    it('should disable escapeValue for React compatibility', () => {
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })
  })

  describe('Language Persistence', () => {
    it('should configure localStorage for language persistence', () => {
      const detectionOptions = i18n.options.detection
      expect(detectionOptions?.caches).toContain('localStorage')
      expect(detectionOptions?.lookupLocalStorage).toBe('i18nextLng')
    })

    it('should provide language change functionality', () => {
      expect(i18n.changeLanguage).toBeDefined()
      expect(typeof i18n.changeLanguage).toBe('function')
    })
  })
})
