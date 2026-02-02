#!/usr/bin/env node

/**
 * CD Workflow Validation Script (Standalone)
 *
 * Validates GitHub Actions CD workflow structure using only Node.js built-ins.
 * Uses basic YAML parsing without external dependencies.
 * Integration tests (artifact downloads, secret injection, actual builds)
 * are validated through workflow execution on GitHub Actions.
 */

import { readFileSync } from 'node:fs'

let exitCode = 0
let passedTests = 0
let failedTests = 0

function test(description, fn) {
  try {
    fn()
    console.log(`✓ ${description}`)
    passedTests++
  } catch (error) {
    console.error(`✗ ${description}`)
    console.error(`  ${error.message}`)
    failedTests++
    exitCode = 1
  }
}

function expect(value) {
  return {
    toBe(expected) {
      if (value !== expected) {
        throw new Error(`Expected ${JSON.stringify(expected)}, got ${JSON.stringify(value)}`)
      }
    },
    toBeDefined() {
      if (value === undefined || value === null) {
        throw new Error('Expected value to be defined')
      }
    },
    toContain(item) {
      if (!Array.isArray(value) || !value.includes(item)) {
        throw new Error(`Expected array to contain ${JSON.stringify(item)}`)
      }
    },
    toBeLessThan(other) {
      if (value >= other) {
        throw new Error(`Expected ${value} to be less than ${other}`)
      }
    },
    toInclude(substring) {
      if (typeof value !== 'string' || !value.includes(substring)) {
        throw new Error(`Expected string to include "${substring}"`)
      }
    }
  }
}

/**
 * Simple YAML parser for GitHub Actions workflows
 * Only parses the specific structure we need to validate
 */
function parseWorkflowYAML(content) {
  const lines = content.split('\n')
  const workflow = { jobs: { build: { steps: [] } } }
  let currentSection = null
  let currentStep = null
  let inBuildJob = false
  let inSteps = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()

    // Parse name (top-level only, not step names)
    if (trimmed.startsWith('name:') && !inBuildJob) {
      workflow.name = trimmed.substring(5).trim()
      continue
    }

    // Parse on.push.branches
    if (trimmed.startsWith('on:')) {
      currentSection = 'on'
      continue
    }
    if (currentSection === 'on' && trimmed.startsWith('branches:')) {
      // Handle inline array format: branches: [main]
      const inlineMatch = trimmed.match(/branches:\s*\[(\w+)\]/)
      if (inlineMatch) {
        workflow.on = { push: { branches: [inlineMatch[1]] } }
      } else {
        // Handle multi-line format
        const nextLine = lines[i + 1]
        const branchMatch = nextLine?.match(/- (\w+)/)
        if (branchMatch) {
          workflow.on = { push: { branches: [branchMatch[1]] } }
        }
      }
      currentSection = null
      continue
    }

    // Parse build job
    if (trimmed.startsWith('build:')) {
      inBuildJob = true
      continue
    }

    if (inBuildJob && trimmed.startsWith('runs-on:')) {
      workflow.jobs.build['runs-on'] = trimmed.split('runs-on:')[1].trim()
      continue
    }

    if (inBuildJob && trimmed.startsWith('steps:')) {
      inSteps = true
      continue
    }

    // Parse steps
    if (inSteps && trimmed.startsWith('- ')) {
      if (currentStep) {
        workflow.jobs.build.steps.push(currentStep)
      }
      currentStep = {}

      // Check for uses
      if (trimmed.includes('uses:')) {
        currentStep.uses = trimmed.split('uses:')[1].trim()
      }
      // Check for run
      else if (trimmed.includes('run:')) {
        currentStep.run = trimmed.split('run:')[1].trim()
      }
      // Check for name
      else if (trimmed.includes('name:')) {
        currentStep.name = trimmed.split('name:')[1].trim()
      }
      continue
    }

    // Parse step properties
    if (inSteps && currentStep && line.startsWith('      ')) {
      if (trimmed.startsWith('name:')) {
        currentStep.name = trimmed.split('name:')[1].trim()
      } else if (trimmed.startsWith('uses:')) {
        currentStep.uses = trimmed.split('uses:')[1].trim()
      } else if (trimmed.startsWith('run:')) {
        currentStep.run = trimmed.split('run:')[1].trim()
      } else if (trimmed.startsWith('with:')) {
        currentStep.with = {}
      } else if (trimmed.startsWith('env:')) {
        currentStep.env = {}
      } else if (currentStep.with && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':')
        const value = valueParts.join(':').trim()
        currentStep.with[key] = value === '0' ? 0 : (value === '90' ? 90 : value)
      } else if (currentStep.env && trimmed.includes(':')) {
        const [key, ...valueParts] = trimmed.split(':')
        currentStep.env[key] = valueParts.join(':').trim()
      }
    }
  }

  if (currentStep) {
    workflow.jobs.build.steps.push(currentStep)
  }

  return workflow
}

console.log('\n🧪 CD Workflow Validation Tests\n')

const content = readFileSync('.github/workflows/cd.yml', 'utf-8')
const workflow = parseWorkflowYAML(content)

test('workflow has correct name', () => {
  expect(workflow.name).toBe('CD')
})

test('workflow triggers on push to main branch', () => {
  expect(workflow.on).toBeDefined()
  expect(workflow.on.push).toBeDefined()
  expect(workflow.on.push.branches).toContain('main')
})

test('workflow has build job', () => {
  expect(workflow.jobs).toBeDefined()
  expect(workflow.jobs.build).toBeDefined()
})

test('build job runs on ubuntu-latest', () => {
  expect(workflow.jobs.build['runs-on']).toBe('ubuntu-latest')
})

test('build job checks out code', () => {
  const steps = workflow.jobs.build.steps
  const checkoutStep = steps.find((s) => s.uses?.includes('actions/checkout'))
  expect(checkoutStep).toBeDefined()
})

test('build job uses correct checkout version and fetch-depth', () => {
  const content_lower = content.toLowerCase()
  expect(content_lower).toInclude('actions/checkout@v4')
  expect(content_lower).toInclude('fetch-depth: 0')
})

test('build job sets up Node.js 20', () => {
  const steps = workflow.jobs.build.steps
  const nodeStep = steps.find((s) => s.uses?.includes('actions/setup-node'))
  expect(nodeStep).toBeDefined()
  expect(content).toInclude('node-version: \'20\'')
  expect(content).toInclude('cache: \'npm\'')
})

test('build job configures Nx cache', () => {
  const steps = workflow.jobs.build.steps
  const cacheStep = steps.find((s) => s.uses?.includes('actions/cache'))
  expect(cacheStep).toBeDefined()
  expect(content).toInclude('path: .nx/cache')
  expect(content).toInclude('package-lock.json')
  expect(content).toInclude('nx.json')
})

test('build job installs dependencies with npm ci', () => {
  const steps = workflow.jobs.build.steps
  const installStep = steps.find((s) => s.run === 'npm ci')
  expect(installStep).toBeDefined()
})

test('build job executes full build of all applications', () => {
  const steps = workflow.jobs.build.steps
  const buildStep = steps.find((s) => s.run?.includes('nx run-many'))
  expect(buildStep).toBeDefined()
  expect(content).toInclude('npx nx run-many -t build --all')
})

test('build job configures VITE_API_URL from secrets', () => {
  expect(content).toInclude('VITE_API_URL')
  expect(content).toInclude('secrets.VITE_API_URL')
})

test('build job uploads web application artifacts', () => {
  const steps = workflow.jobs.build.steps
  const uploadStep = steps.find((s) =>
    s.uses?.includes('actions/upload-artifact') &&
    s.name?.includes('web')
  )
  expect(uploadStep).toBeDefined()
  expect(content).toInclude('name: dist-web')
  expect(content).toInclude('path: dist/apps/web')
  expect(content).toInclude('retention-days: 90')
})

test('build job uploads api application artifacts', () => {
  const steps = workflow.jobs.build.steps
  const uploadStep = steps.find((s) =>
    s.uses?.includes('actions/upload-artifact') &&
    s.name?.includes('api')
  )
  expect(uploadStep).toBeDefined()
  expect(content).toInclude('name: dist-api')
  expect(content).toInclude('path: dist/apps/api')
})

console.log(`\n✅ ${passedTests} tests passed`)
if (failedTests > 0) {
  console.log(`❌ ${failedTests} tests failed\n`)
}

process.exit(exitCode)
