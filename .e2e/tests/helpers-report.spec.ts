import { test, expect } from '@playwright/test'
import { parsePlaywrightResults, generateMarkdownReport, generateHtmlReport } from '../helpers/report'
import { writeFile, mkdir, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const currentFilePath = fileURLToPath(import.meta.url)
const currentDir = dirname(currentFilePath)
const TEMP_DIR = join(currentDir, 'test-temp')

test.describe('Report Generator', () => {
  test.beforeAll(async () => {
    await mkdir(TEMP_DIR, { recursive: true })
  })

  test.afterAll(async () => {
    await rm(TEMP_DIR, { recursive: true, force: true })
  })

  test('should parse Playwright JSON test results correctly', async () => {
    const mockResults = {
      config: { version: '1.0.0' },
      suites: [
        {
          title: '01-test.spec.ts',
          file: '01-test.spec.ts',
          line: 0,
          column: 0,
          specs: [],
          suites: [
            {
              title: 'Test Suite',
              file: '01-test.spec.ts',
              line: 1,
              column: 0,
              specs: [
                {
                  title: 'should pass test',
                  ok: true,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'passed',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [
                        {
                          status: 'passed',
                          duration: 1500,
                          attachments: [],
                          startTime: '2024-01-01T00:00:00.000Z',
                        },
                      ],
                      status: 'passed',
                    },
                  ],
                  id: 'test-1',
                  file: '01-test.spec.ts',
                  line: 5,
                  column: 2,
                },
              ],
            },
          ],
        },
      ],
    }

    const testFile = join(TEMP_DIR, 'test-results.json')
    await writeFile(testFile, JSON.stringify(mockResults))

    const summary = await parsePlaywrightResults(testFile)

    expect(summary.totalTests).toBe(1)
    expect(summary.passed).toBe(1)
    expect(summary.failed).toBe(0)
    expect(summary.skipped).toBe(0)
    expect(summary.passRate).toBe(100)
    expect(summary.totalDuration).toBe(1500)
    expect(summary.results).toHaveLength(1)
    expect(summary.results[0].flow).toBe('Test')
    expect(summary.results[0].test).toBe('should pass test')
    expect(summary.results[0].status).toBe('passed')
  })

  test('should calculate test counters accurately', async () => {
    const mockResults = {
      config: { version: '1.0.0' },
      suites: [
        {
          title: '01-test.spec.ts',
          file: '01-test.spec.ts',
          line: 0,
          column: 0,
          specs: [],
          suites: [
            {
              title: 'Test Suite',
              file: '01-test.spec.ts',
              line: 1,
              column: 0,
              specs: [
                {
                  title: 'test 1',
                  ok: true,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'passed',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [{ status: 'passed', duration: 100, attachments: [], startTime: '2024-01-01T00:00:00.000Z' }],
                      status: 'passed',
                    },
                  ],
                  id: 'test-1',
                  file: '01-test.spec.ts',
                  line: 5,
                  column: 2,
                },
                {
                  title: 'test 2',
                  ok: false,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'passed',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [
                        {
                          status: 'failed',
                          duration: 200,
                          error: { message: 'Test failed' },
                          attachments: [],
                          startTime: '2024-01-01T00:00:00.000Z',
                        },
                      ],
                      status: 'failed',
                    },
                  ],
                  id: 'test-2',
                  file: '01-test.spec.ts',
                  line: 10,
                  column: 2,
                },
                {
                  title: 'test 3',
                  ok: true,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'skipped',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [{ status: 'skipped', duration: 0, attachments: [], startTime: '2024-01-01T00:00:00.000Z' }],
                      status: 'skipped',
                    },
                  ],
                  id: 'test-3',
                  file: '01-test.spec.ts',
                  line: 15,
                  column: 2,
                },
              ],
            },
          ],
        },
      ],
    }

    const testFile = join(TEMP_DIR, 'counters-test.json')
    await writeFile(testFile, JSON.stringify(mockResults))

    const summary = await parsePlaywrightResults(testFile)

    expect(summary.totalTests).toBe(3)
    expect(summary.passed).toBe(1)
    expect(summary.failed).toBe(1)
    expect(summary.skipped).toBe(1)
    expect(summary.passRate).toBeCloseTo(33.33, 1)
  })

  test('should generate valid Markdown format with proper structure', async () => {
    const summary = {
      totalTests: 5,
      passed: 3,
      failed: 1,
      skipped: 1,
      passRate: 60,
      totalDuration: 5000,
      results: [
        {
          flow: 'Auth',
          test: 'should login',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Auth',
          test: 'should fail',
          status: 'failed' as const,
          duration: 2000,
          error: 'Login failed',
        },
      ],
    }

    const markdown = generateMarkdownReport(summary)

    expect(markdown).toContain('# E2E Test Execution Report')
    expect(markdown).toContain('## Executive Summary')
    expect(markdown).toContain('**Total Tests:** 5')
    expect(markdown).toContain('**Passed:** 3 ✅')
    expect(markdown).toContain('**Failed:** 1 ❌')
    expect(markdown).toContain('**Skipped:** 1 ⏭️')
    expect(markdown).toContain('**Pass Rate:** 60.00%')
    expect(markdown).toContain('## Results by Flow')
    expect(markdown).toContain('### Auth')
    expect(markdown).toContain('## Failed Tests Details')
  })

  test('should generate valid HTML with embedded screenshots', async () => {
    const summary = {
      totalTests: 2,
      passed: 1,
      failed: 1,
      skipped: 0,
      passRate: 50,
      totalDuration: 3000,
      results: [
        {
          flow: 'Test',
          test: 'should pass',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Test',
          test: 'should fail',
          status: 'failed' as const,
          duration: 2000,
          error: 'Test error',
          screenshot: '/path/to/screenshot.png',
        },
      ],
    }

    const html = generateHtmlReport(summary)

    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('<html lang="en">')
    expect(html).toContain('E2E Test Execution Report')
    expect(html).toContain('<div class="summary-card passed">')
    expect(html).toContain('<div class="summary-card failed">')
    expect(html).toContain('/path/to/screenshot.png')
    expect(html).toContain('Test error')
    expect(html).toContain('alt="Test failure screenshot"')
  })

  test('should handle missing screenshots gracefully', async () => {
    const summary = {
      totalTests: 1,
      passed: 0,
      failed: 1,
      skipped: 0,
      passRate: 0,
      totalDuration: 1000,
      results: [
        {
          flow: 'Test',
          test: 'should fail without screenshot',
          status: 'failed' as const,
          duration: 1000,
          error: 'Test failed',
        },
      ],
    }

    const html = generateHtmlReport(summary)

    expect(html).not.toContain('<img')
    expect(html).toContain('Test failed')
    expect(html).toContain('Failed Tests Details')
  })

  test('should handle test results with no failures (all passed)', async () => {
    const summary = {
      totalTests: 3,
      passed: 3,
      failed: 0,
      skipped: 0,
      passRate: 100,
      totalDuration: 3000,
      results: [
        {
          flow: 'Test',
          test: 'test 1',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Test',
          test: 'test 2',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Test',
          test: 'test 3',
          status: 'passed' as const,
          duration: 1000,
        },
      ],
    }

    const markdown = generateMarkdownReport(summary)
    const html = generateHtmlReport(summary)

    expect(markdown).not.toContain('## Failed Tests Details')
    expect(markdown).toContain('**Pass Rate:** 100.00%')
    expect(html).not.toContain('Failed Tests Details')
  })

  test('should handle test results with all failures', async () => {
    const summary = {
      totalTests: 2,
      passed: 0,
      failed: 2,
      skipped: 0,
      passRate: 0,
      totalDuration: 2000,
      results: [
        {
          flow: 'Test',
          test: 'test 1',
          status: 'failed' as const,
          duration: 1000,
          error: 'Error 1',
        },
        {
          flow: 'Test',
          test: 'test 2',
          status: 'failed' as const,
          duration: 1000,
          error: 'Error 2',
        },
      ],
    }

    const markdown = generateMarkdownReport(summary)
    const html = generateHtmlReport(summary)

    expect(markdown).toContain('## Failed Tests Details')
    expect(markdown).toContain('Error 1')
    expect(markdown).toContain('Error 2')
    expect(html).toContain('Failed Tests Details')
  })

  test('should include error messages and stack traces for failed tests', async () => {
    const summary = {
      totalTests: 1,
      passed: 0,
      failed: 1,
      skipped: 0,
      passRate: 0,
      totalDuration: 1000,
      results: [
        {
          flow: 'Test',
          test: 'should fail',
          status: 'failed' as const,
          duration: 1000,
          error: 'Detailed error message',
          errorStack: 'at line 10\nat file.ts:5',
        },
      ],
    }

    const markdown = generateMarkdownReport(summary)

    expect(markdown).toContain('Detailed error message')
  })

  test('should calculate total execution duration correctly', async () => {
    const mockResults = {
      config: { version: '1.0.0' },
      suites: [
        {
          title: '01-test.spec.ts',
          file: '01-test.spec.ts',
          line: 0,
          column: 0,
          specs: [],
          suites: [
            {
              title: 'Test Suite',
              file: '01-test.spec.ts',
              line: 1,
              column: 0,
              specs: [
                {
                  title: 'test 1',
                  ok: true,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'passed',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [{ status: 'passed', duration: 1234, attachments: [], startTime: '2024-01-01T00:00:00.000Z' }],
                      status: 'passed',
                    },
                  ],
                  id: 'test-1',
                  file: '01-test.spec.ts',
                  line: 5,
                  column: 2,
                },
                {
                  title: 'test 2',
                  ok: true,
                  tags: [],
                  tests: [
                    {
                      timeout: 30000,
                      expectedStatus: 'passed',
                      projectId: 'chromium',
                      projectName: 'chromium',
                      results: [{ status: 'passed', duration: 5678, attachments: [], startTime: '2024-01-01T00:00:00.000Z' }],
                      status: 'passed',
                    },
                  ],
                  id: 'test-2',
                  file: '01-test.spec.ts',
                  line: 10,
                  column: 2,
                },
              ],
            },
          ],
        },
      ],
    }

    const testFile = join(TEMP_DIR, 'duration-test.json')
    await writeFile(testFile, JSON.stringify(mockResults))

    const summary = await parsePlaywrightResults(testFile)

    expect(summary.totalDuration).toBe(6912)
  })

  test('should organize results by test flow (grouping)', async () => {
    const summary = {
      totalTests: 4,
      passed: 4,
      failed: 0,
      skipped: 0,
      passRate: 100,
      totalDuration: 4000,
      results: [
        {
          flow: 'Auth',
          test: 'test 1',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Payments',
          test: 'test 2',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Auth',
          test: 'test 3',
          status: 'passed' as const,
          duration: 1000,
        },
        {
          flow: 'Payments',
          test: 'test 4',
          status: 'passed' as const,
          duration: 1000,
        },
      ],
    }

    const markdown = generateMarkdownReport(summary)

    expect(markdown).toContain('### Auth')
    expect(markdown).toContain('### Payments')
    const authIndex = markdown.indexOf('### Auth')
    const paymentsIndex = markdown.indexOf('### Payments')
    expect(authIndex).toBeGreaterThan(0)
    expect(paymentsIndex).toBeGreaterThan(0)
  })

  test('should handle empty test results', async () => {
    const mockResults = {
      config: { version: '1.0.0' },
      suites: [],
    }

    const testFile = join(TEMP_DIR, 'empty-test.json')
    await writeFile(testFile, JSON.stringify(mockResults))

    const summary = await parsePlaywrightResults(testFile)

    expect(summary.totalTests).toBe(0)
    expect(summary.passed).toBe(0)
    expect(summary.failed).toBe(0)
    expect(summary.skipped).toBe(0)
    expect(summary.passRate).toBe(0)
    expect(summary.totalDuration).toBe(0)
  })

  test('should handle malformed JSON input gracefully', async () => {
    const testFile = join(TEMP_DIR, 'malformed.json')
    await writeFile(testFile, 'invalid json content')

    await expect(parsePlaywrightResults(testFile)).rejects.toThrow()
  })

  test('should escape HTML special characters to prevent XSS', () => {
    const summary = {
      totalTests: 1,
      passed: 0,
      failed: 1,
      skipped: 0,
      passRate: 0,
      totalDuration: 1000,
      results: [
        {
          flow: '<script>alert("xss")</script>',
          test: '<img src=x onerror=alert(1)>',
          status: 'failed' as const,
          duration: 1000,
          error: '<script>alert("error")</script>',
          screenshot: '"><script>alert("path")</script>',
        },
      ],
    }

    const html = generateHtmlReport(summary)

    expect(html).not.toContain('<script>alert("xss")</script>')
    expect(html).not.toContain('<img src=x onerror=alert(1)>')
    expect(html).not.toContain('<script>alert("error")</script>')
    expect(html).toContain('&lt;script&gt;')
    expect(html).toContain('&lt;img')
  })
})
