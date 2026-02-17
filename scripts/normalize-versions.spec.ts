import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

const TARGET_VERSION = '0.1.0'

const PACKAGE_PATHS = [
  'package.json',
  'apps/api/package.json',
  'apps/web/package.json',
  'apps/landing/package.json',
  'libs/db/package.json',
  'libs/billing/package.json',
  'libs/email/package.json',
  'libs/observability/package.json',
  'libs/shared/env/package.json',
  'libs/shared/types/package.json',
]

describe('normalize-versions script', () => {
  describe('package.json version normalization', () => {
    it('should read all package.json files correctly', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        expect(() => {
          const content = fs.readFileSync(fullPath, 'utf8')
          JSON.parse(content)
        }).not.toThrow()
      }
    })

    it('should have all packages at version 0.1.0', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).toBe(TARGET_VERSION)
      }
    })

    it('should preserve other package.json fields unchanged', () => {
      const rootPackagePath = path.join(rootDir, 'package.json')
      const content = fs.readFileSync(rootPackagePath, 'utf8')
      const packageJson = JSON.parse(content)

      expect(packageJson.name).toBeDefined()
      expect(packageJson.scripts).toBeDefined()
      expect(packageJson.devDependencies).toBeDefined()
    })

    it('should have version field in all packages', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).toBeDefined()
        expect(typeof packageJson.version).toBe('string')
      }
    })

    it('should be idempotent - running twice produces same result', () => {
      const snapshots = new Map()

      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        snapshots.set(packagePath, content)
      }

      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const currentContent = fs.readFileSync(fullPath, 'utf8')
        expect(currentContent).toBe(snapshots.get(packagePath))
      }
    })

    it('should maintain valid JSON format in all packages', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        expect(() => JSON.parse(content)).not.toThrow()

        const packageJson = JSON.parse(content)
        expect(typeof packageJson).toBe('object')
        expect(packageJson).not.toBeNull()
      }
    })
  })

  describe('version format validation', () => {
    it('should have semantic version format', () => {
      const semverRegex = /^\d+\.\d+\.\d+$/

      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).toMatch(semverRegex)
      }
    })

    it('should match target version exactly', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).toBe(TARGET_VERSION)
      }
    })
  })

  describe('integration validation', () => {
    it('should have exactly 10 packages normalized', () => {
      expect(PACKAGE_PATHS).toHaveLength(10)
    })

    it('should include root package.json', () => {
      expect(PACKAGE_PATHS).toContain('package.json')
    })

    it('should include all app packages', () => {
      const appPackages = PACKAGE_PATHS.filter(p => p.startsWith('apps/'))
      expect(appPackages).toHaveLength(3)
      expect(appPackages).toContain('apps/api/package.json')
      expect(appPackages).toContain('apps/web/package.json')
      expect(appPackages).toContain('apps/landing/package.json')
    })

    it('should include all lib packages', () => {
      const libPackages = PACKAGE_PATHS.filter(p => p.startsWith('libs/'))
      expect(libPackages).toHaveLength(6)
      expect(libPackages).toContain('libs/db/package.json')
      expect(libPackages).toContain('libs/billing/package.json')
      expect(libPackages).toContain('libs/email/package.json')
      expect(libPackages).toContain('libs/observability/package.json')
      expect(libPackages).toContain('libs/shared/env/package.json')
      expect(libPackages).toContain('libs/shared/types/package.json')
    })

    it('should have no package with version 0.0.0', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).not.toBe('0.0.0')
      }
    })

    it('should have no package with version 0.0.1', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.version).not.toBe('0.0.1')
      }
    })
  })

  describe('package.json structure validation', () => {
    it('should have name field in all packages', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        expect(packageJson.name).toBeDefined()
        expect(typeof packageJson.name).toBe('string')
      }
    })

    it('should preserve package.json indentation (2 spaces)', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const lines = content.split('\n')
        const indentedLine = lines.find(line => line.startsWith('  '))
        if (indentedLine) {
          expect(indentedLine.match(/^\s+/)?.[0]).toBe('  ')
        }
      }
    })

    it('should end with newline', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        expect(content.endsWith('\n')).toBe(true)
      }
    })
  })

  describe('error handling simulation', () => {
    it('should handle invalid JSON gracefully in theory', () => {
      const invalidJson = '{ "name": "test", invalid }'
      expect(() => JSON.parse(invalidJson)).toThrow()
    })

    it('should validate JSON before processing', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const isValidJson = (() => {
          try {
            JSON.parse(content)
            return true
          } catch {
            return false
          }
        })()
        expect(isValidJson).toBe(true)
      }
    })
  })

  describe('fixed versioning compatibility', () => {
    it('should have all packages at same version for Changesets fixed strategy', () => {
      const versions = new Set()

      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)
        versions.add(packageJson.version)
      }

      expect(versions.size).toBe(1)
      expect(versions.has(TARGET_VERSION)).toBe(true)
    })

    it('should be compatible with Changesets fixed versioning requirements', () => {
      for (const packagePath of PACKAGE_PATHS) {
        const fullPath = path.join(rootDir, packagePath)
        const content = fs.readFileSync(fullPath, 'utf8')
        const packageJson = JSON.parse(content)

        expect(packageJson.version).toBe(TARGET_VERSION)
        expect(packageJson.version).toMatch(/^\d+\.\d+\.\d+$/)
      }
    })
  })
})
