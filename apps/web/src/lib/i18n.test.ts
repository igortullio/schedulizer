import { beforeEach, describe, expect, it, vi } from 'vitest'

describe('i18n configuration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('initialization', () => {
    it('should export i18n instance', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n).toBeDefined()
      expect(typeof i18n.t).toBe('function')
      expect(typeof i18n.changeLanguage).toBe('function')
    })

    it('should have correct fallback language', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.fallbackLng).toEqual(['pt-BR'])
    })

    it('should support pt-BR and en languages', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.supportedLngs).toContain('pt-BR')
      expect(i18n.options.supportedLngs).toContain('en')
    })

    it('should configure auth and common namespaces', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.ns).toContain('auth')
      expect(i18n.options.ns).toContain('common')
    })

    it('should set auth as default namespace', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.defaultNS).toBe('auth')
    })
  })

  describe('language detection', () => {
    it('should configure localStorage as primary detection method', async () => {
      const { default: i18n } = await import('./i18n')
      const detectionOrder = i18n.options.detection?.order
      expect(detectionOrder).toContain('localStorage')
      expect(detectionOrder?.[0]).toBe('localStorage')
    })

    it('should configure navigator as fallback detection method', async () => {
      const { default: i18n } = await import('./i18n')
      const detectionOrder = i18n.options.detection?.order
      expect(detectionOrder).toContain('navigator')
    })

    it('should configure localStorage as cache storage', async () => {
      const { default: i18n } = await import('./i18n')
      const caches = i18n.options.detection?.caches
      expect(caches).toContain('localStorage')
    })

    it('should use correct localStorage key', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.detection?.lookupLocalStorage).toBe('i18nextLng')
    })
  })

  describe('backend configuration', () => {
    it('should configure correct load path for translations', async () => {
      const { default: i18n } = await import('./i18n')
      expect((i18n.options.backend as { loadPath?: string })?.loadPath).toBe('/locales/{{lng}}/{{ns}}.json')
    })
  })

  describe('react configuration', () => {
    it('should enable react suspense', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.react?.useSuspense).toBe(true)
    })
  })

  describe('interpolation', () => {
    it('should disable escape value for react', async () => {
      const { default: i18n } = await import('./i18n')
      expect(i18n.options.interpolation?.escapeValue).toBe(false)
    })
  })
})
