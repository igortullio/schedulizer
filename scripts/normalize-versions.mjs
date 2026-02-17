#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

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

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

function normalizeVersion(packagePath) {
  const fullPath = path.join(rootDir, packagePath)

  try {
    const content = fs.readFileSync(fullPath, 'utf8')
    const packageJson = JSON.parse(content)

    if (!packageJson.version) {
      console.log(`Warning: ${packagePath}: No version field found, adding ${TARGET_VERSION}`)
      packageJson.version = TARGET_VERSION
    } else if (packageJson.version === TARGET_VERSION) {
      console.log(`Success: ${packagePath}: Already at ${TARGET_VERSION}`)
      return true
    } else {
      console.log(`Update: ${packagePath}: ${packageJson.version} -> ${TARGET_VERSION}`)
      packageJson.version = TARGET_VERSION
    }

    const updatedContent = `${JSON.stringify(packageJson, null, 2)}\n`
    fs.writeFileSync(fullPath, updatedContent, 'utf8')

    return true
  } catch (error) {
    console.error(`Error: ${packagePath}: Failed to update - ${error.message}`)
    return false
  }
}

function validateAllVersions() {
  const results = []

  for (const packagePath of PACKAGE_PATHS) {
    const fullPath = path.join(rootDir, packagePath)

    try {
      const content = fs.readFileSync(fullPath, 'utf8')
      const packageJson = JSON.parse(content)

      if (packageJson.version === TARGET_VERSION) {
        results.push({ path: packagePath, success: true })
      } else {
        results.push({
          path: packagePath,
          success: false,
          version: packageJson.version,
        })
      }
    } catch (error) {
      results.push({
        path: packagePath,
        success: false,
        error: error.message,
      })
    }
  }

  return results
}

function main() {
  console.log(`\nNormalizing package versions to ${TARGET_VERSION}...\n`)

  const failures = []

  for (const packagePath of PACKAGE_PATHS) {
    const success = normalizeVersion(packagePath)
    if (!success) {
      failures.push(packagePath)
    }
  }

  console.log('\nValidating all packages...\n')

  const validationResults = validateAllVersions()
  const validationFailures = validationResults.filter(r => !r.success)

  if (validationFailures.length > 0) {
    console.error('\nValidation failed for the following packages:\n')
    for (const result of validationFailures) {
      if (result.error) {
        console.error(`   ${result.path}: ${result.error}`)
      } else {
        console.error(`   ${result.path}: Expected ${TARGET_VERSION}, got ${result.version}`)
      }
    }
    process.exit(1)
  }

  if (failures.length > 0) {
    console.error(`\nFailed to update ${failures.length} package(s)\n`)
    process.exit(1)
  }

  console.log(`\nAll packages successfully normalized to ${TARGET_VERSION}\n`)
  process.exit(0)
}

main()
