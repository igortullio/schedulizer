import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

interface PlaywrightAttachment {
  name: string
  contentType: string
  path: string
}

interface PlaywrightError {
  message: string
  stack?: string
  location?: {
    file: string
    line: number
    column: number
  }
  snippet?: string
}

interface PlaywrightTestResult {
  status: 'passed' | 'failed' | 'skipped' | 'unexpected'
  duration: number
  error?: PlaywrightError
  errors?: Array<{ message: string; location?: { file: string; line: number; column: number } }>
  attachments: PlaywrightAttachment[]
  startTime: string
}

interface PlaywrightTest {
  timeout: number
  expectedStatus: string
  projectId: string
  projectName: string
  results: PlaywrightTestResult[]
  status: string
}

interface PlaywrightSpec {
  title: string
  ok: boolean
  tags: string[]
  tests: PlaywrightTest[]
  id: string
  file: string
  line: number
  column: number
}

interface PlaywrightSuite {
  title: string
  file: string
  line: number
  column: number
  specs: PlaywrightSpec[]
  suites?: PlaywrightSuite[]
}

interface PlaywrightJsonReport {
  config: {
    version: string
    metadata?: {
      actualWorkers: number
    }
  }
  suites: PlaywrightSuite[]
}

interface TestResult {
  flow: string
  test: string
  status: 'passed' | 'failed' | 'skipped'
  duration: number
  screenshot?: string
  error?: string
  errorStack?: string
}

interface TestSummary {
  totalTests: number
  passed: number
  failed: number
  skipped: number
  passRate: number
  totalDuration: number
  results: TestResult[]
}

function extractFlowName(filename: string): string {
  const match = filename.match(/^\d+-(.+)\.spec\.ts$/)
  if (match) {
    return match[1].charAt(0).toUpperCase() + match[1].slice(1)
  }
  return filename.replace('.spec.ts', '')
}

function getTestStatus(test: PlaywrightTest): 'passed' | 'failed' | 'skipped' {
  if (test.status === 'skipped') return 'skipped'
  if (test.status === 'unexpected' || test.status === 'failed') return 'failed'
  return 'passed'
}

function getScreenshotPath(result: PlaywrightTestResult): string | undefined {
  const screenshot = result.attachments.find((att) => att.contentType === 'image/png')
  return screenshot?.path
}

function getErrorMessage(result: PlaywrightTestResult): string | undefined {
  if (result.error) {
    return result.error.message
  }
  if (result.errors && result.errors.length > 0) {
    return result.errors[0].message
  }
  return undefined
}

function getErrorStack(result: PlaywrightTestResult): string | undefined {
  return result.error?.stack
}

export async function parsePlaywrightResults(jsonPath: string): Promise<TestSummary> {
  const content = await readFile(jsonPath, 'utf-8')
  const report: PlaywrightJsonReport = JSON.parse(content)

  const results: TestResult[] = []
  let totalDuration = 0

  function processSuite(suite: PlaywrightSuite) {
    suite.specs.forEach((spec) => {
      spec.tests.forEach((test) => {
        const testResult = test.results[0]
        if (!testResult) return

        const status = getTestStatus(test)
        const duration = testResult.duration
        const screenshot = getScreenshotPath(testResult)
        const error = getErrorMessage(testResult)
        const errorStack = getErrorStack(testResult)

        results.push({
          flow: extractFlowName(suite.file),
          test: spec.title,
          status,
          duration,
          screenshot,
          error,
          errorStack,
        })

        totalDuration += duration
      })
    })

    if (suite.suites) {
      suite.suites.forEach((nestedSuite) => processSuite(nestedSuite))
    }
  }

  report.suites.forEach((suite) => processSuite(suite))

  const totalTests = results.length
  const passed = results.filter((r) => r.status === 'passed').length
  const failed = results.filter((r) => r.status === 'failed').length
  const skipped = results.filter((r) => r.status === 'skipped').length
  const passRate = totalTests > 0 ? (passed / totalTests) * 100 : 0

  return {
    totalTests,
    passed,
    failed,
    skipped,
    passRate,
    totalDuration,
    results,
  }
}

function groupResultsByFlow(results: TestResult[]): Map<string, TestResult[]> {
  const flowGroups = new Map<string, TestResult[]>()
  results.forEach((result) => {
    if (!flowGroups.has(result.flow)) {
      flowGroups.set(result.flow, [])
    }
    flowGroups.get(result.flow)!.push(result)
  })
  return flowGroups
}

function generateExecutiveSummary(summary: TestSummary): string[] {
  const lines: string[] = []
  lines.push('# E2E Test Execution Report\n')
  lines.push(`**Generated at:** ${new Date().toISOString()}\n`)
  lines.push('## Executive Summary\n')
  lines.push(`- **Total Tests:** ${summary.totalTests}`)
  lines.push(`- **Passed:** ${summary.passed} ✅`)
  lines.push(`- **Failed:** ${summary.failed} ❌`)
  lines.push(`- **Skipped:** ${summary.skipped} ⏭️`)
  lines.push(`- **Pass Rate:** ${summary.passRate.toFixed(2)}%`)
  lines.push(`- **Total Duration:** ${(summary.totalDuration / 1000).toFixed(2)}s\n`)
  return lines
}

function generateFlowSection(flow: string, tests: TestResult[]): string[] {
  const lines: string[] = []
  const flowPassed = tests.filter((t) => t.status === 'passed').length
  const flowFailed = tests.filter((t) => t.status === 'failed').length
  const flowSkipped = tests.filter((t) => t.status === 'skipped').length
  const flowTotal = tests.length

  lines.push(`### ${flow}`)
  lines.push(`- Total: ${flowTotal} | Passed: ${flowPassed} ✅ | Failed: ${flowFailed} ❌ | Skipped: ${flowSkipped} ⏭️\n`)

  tests.forEach((test) => {
    const statusIcon = test.status === 'passed' ? '✅' : test.status === 'failed' ? '❌' : '⏭️'
    lines.push(`- ${statusIcon} **${test.test}** (${(test.duration / 1000).toFixed(2)}s)`)
  })
  lines.push('')
  return lines
}

function generateFailedTestsSection(failedTests: TestResult[]): string[] {
  const lines: string[] = []
  if (failedTests.length === 0) return lines

  lines.push('## Failed Tests Details\n')
  failedTests.forEach((test) => {
    lines.push(`### ❌ ${test.flow}: ${test.test}\n`)
    if (test.error) {
      lines.push('**Error:**')
      lines.push('```')
      lines.push(test.error)
      lines.push('```\n')
    }
    if (test.screenshot) {
      lines.push(`**Screenshot:** \`${test.screenshot}\`\n`)
    }
  })
  return lines
}

export function generateMarkdownReport(summary: TestSummary): string {
  const lines: string[] = []

  lines.push(...generateExecutiveSummary(summary))

  const flowGroups = groupResultsByFlow(summary.results)

  lines.push('## Results by Flow\n')
  flowGroups.forEach((tests, flow) => {
    lines.push(...generateFlowSection(flow, tests))
  })

  const failedTests = summary.results.filter((r) => r.status === 'failed')
  lines.push(...generateFailedTestsSection(failedTests))

  lines.push('---\n')
  lines.push('For detailed visual evidence, see the HTML report at `reports/html-report/index.html`\n')

  return lines.join('\n')
}

function generateHtmlStyles(): string {
  return `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; padding: 20px; }
    .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1); padding: 40px; }
    h1 { color: #333; margin-bottom: 10px; font-size: 32px; }
    .timestamp { color: #666; font-size: 14px; margin-bottom: 30px; }
    .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 20px; margin-bottom: 40px; }
    .summary-card { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
    .summary-card.passed { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
    .summary-card.failed { background: linear-gradient(135deg, #eb3349 0%, #f45c43 100%); }
    .summary-card.skipped { background: linear-gradient(135deg, #757f9a 0%, #d7dde8 100%); }
    .summary-label { font-size: 12px; text-transform: uppercase; opacity: 0.9; margin-bottom: 5px; }
    .summary-value { font-size: 28px; font-weight: bold; }
    h2 { color: #333; margin: 40px 0 20px; font-size: 24px; border-bottom: 2px solid #667eea; padding-bottom: 10px; }
    .flow-section { margin-bottom: 30px; }
    .flow-header { background: #f8f9fa; padding: 15px; border-radius: 6px; margin-bottom: 15px; }
    .flow-title { font-size: 20px; font-weight: 600; color: #333; }
    .flow-stats { font-size: 14px; color: #666; margin-top: 5px; }
    .test-list { list-style: none; }
    .test-item { padding: 12px; margin-bottom: 8px; border-radius: 6px; border-left: 4px solid #ddd; background: #f8f9fa; display: flex; justify-content: space-between; align-items: center; }
    .test-item.passed { border-left-color: #38ef7d; background: #f0fdf4; }
    .test-item.failed { border-left-color: #f45c43; background: #fef2f2; }
    .test-item.skipped { border-left-color: #d7dde8; background: #f9fafb; }
    .test-name { flex: 1; font-weight: 500; }
    .test-duration { color: #666; font-size: 14px; margin-left: 10px; }
    .badge { display: inline-block; padding: 4px 12px; border-radius: 12px; font-size: 12px; font-weight: 600; text-transform: uppercase; }
    .badge.passed { background: #38ef7d; color: white; }
    .badge.failed { background: #f45c43; color: white; }
    .badge.skipped { background: #d7dde8; color: #333; }
    .error-section { margin-top: 30px; }
    .error-item { background: #fef2f2; border: 1px solid #f45c43; border-radius: 6px; padding: 20px; margin-bottom: 20px; }
    .error-title { font-weight: 600; color: #991b1b; margin-bottom: 10px; }
    .error-message { background: white; padding: 15px; border-radius: 4px; font-family: monospace; font-size: 13px; white-space: pre-wrap; word-break: break-word; color: #333; }
    .screenshot { margin-top: 15px; }
    .screenshot img { max-width: 100%; border-radius: 4px; border: 1px solid #ddd; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px; }
  `
}

function generateHtmlHeader(): string[] {
  const html: string[] = []
  html.push('<!DOCTYPE html>')
  html.push('<html lang="en">')
  html.push('<head>')
  html.push('  <meta charset="UTF-8">')
  html.push('  <meta name="viewport" content="width=device-width, initial-scale=1.0">')
  html.push('  <title>E2E Test Report</title>')
  html.push(`  <style>${generateHtmlStyles()}</style>`)
  html.push('</head>')
  html.push('<body>')
  html.push('  <div class="container">')
  html.push('    <h1>E2E Test Execution Report</h1>')
  html.push(`    <div class="timestamp">Generated at: ${new Date().toISOString()}</div>`)
  return html
}

function generateHtmlSummaryCards(summary: TestSummary): string[] {
  const html: string[] = []
  html.push('    <div class="summary">')
  html.push('      <div class="summary-card">')
  html.push('        <div class="summary-label">Total Tests</div>')
  html.push(`        <div class="summary-value">${summary.totalTests}</div>`)
  html.push('      </div>')
  html.push('      <div class="summary-card passed">')
  html.push('        <div class="summary-label">Passed</div>')
  html.push(`        <div class="summary-value">${summary.passed}</div>`)
  html.push('      </div>')
  html.push('      <div class="summary-card failed">')
  html.push('        <div class="summary-label">Failed</div>')
  html.push(`        <div class="summary-value">${summary.failed}</div>`)
  html.push('      </div>')
  html.push('      <div class="summary-card skipped">')
  html.push('        <div class="summary-label">Skipped</div>')
  html.push(`        <div class="summary-value">${summary.skipped}</div>`)
  html.push('      </div>')
  html.push('      <div class="summary-card">')
  html.push('        <div class="summary-label">Pass Rate</div>')
  html.push(`        <div class="summary-value">${summary.passRate.toFixed(1)}%</div>`)
  html.push('      </div>')
  html.push('      <div class="summary-card">')
  html.push('        <div class="summary-label">Duration</div>')
  html.push(`        <div class="summary-value">${(summary.totalDuration / 1000).toFixed(1)}s</div>`)
  html.push('      </div>')
  html.push('    </div>')
  return html
}

function generateHtmlFlowSection(flow: string, tests: TestResult[]): string[] {
  const html: string[] = []
  const flowPassed = tests.filter((t) => t.status === 'passed').length
  const flowFailed = tests.filter((t) => t.status === 'failed').length
  const flowSkipped = tests.filter((t) => t.status === 'skipped').length
  const flowTotal = tests.length

  html.push('    <div class="flow-section">')
  html.push('      <div class="flow-header">')
  html.push(`        <div class="flow-title">${escapeHtml(flow)}</div>`)
  html.push(
    `        <div class="flow-stats">Total: ${flowTotal} | Passed: ${flowPassed} | Failed: ${flowFailed} | Skipped: ${flowSkipped}</div>`
  )
  html.push('      </div>')
  html.push('      <ul class="test-list">')

  tests.forEach((test) => {
    html.push(`        <li class="test-item ${test.status}">`)
    html.push('          <div class="test-name">')
    html.push(`            <span class="badge ${test.status}">${test.status}</span>`)
    html.push(`            ${escapeHtml(test.test)}`)
    html.push('          </div>')
    html.push(`          <div class="test-duration">${(test.duration / 1000).toFixed(2)}s</div>`)
    html.push('        </li>')
  })

  html.push('      </ul>')
  html.push('    </div>')
  return html
}

function generateHtmlFailedTestsSection(failedTests: TestResult[]): string[] {
  const html: string[] = []
  if (failedTests.length === 0) return html

  html.push('    <h2>Failed Tests Details</h2>')
  html.push('    <div class="error-section">')

  failedTests.forEach((test) => {
    html.push('      <div class="error-item">')
    html.push(`        <div class="error-title">${escapeHtml(test.flow)}: ${escapeHtml(test.test)}</div>`)
    if (test.error) {
      html.push(`        <div class="error-message">${escapeHtml(test.error)}</div>`)
    }
    if (test.screenshot) {
      html.push('        <div class="screenshot">')
      html.push(
        `          <img src="${escapeHtml(test.screenshot)}" alt="Test failure screenshot" loading="lazy" />`
      )
      html.push('        </div>')
    }
    html.push('      </div>')
  })

  html.push('    </div>')
  return html
}

function generateHtmlFooter(): string[] {
  const html: string[] = []
  html.push('    <div class="footer">')
  html.push(
    '      <p>For interactive trace viewer and detailed execution logs, see the Playwright HTML report at <code>reports/html-report/index.html</code></p>'
  )
  html.push('    </div>')
  html.push('  </div>')
  html.push('</body>')
  html.push('</html>')
  return html
}

export function generateHtmlReport(summary: TestSummary): string {
  const html: string[] = []

  html.push(...generateHtmlHeader())
  html.push(...generateHtmlSummaryCards(summary))

  const flowGroups = groupResultsByFlow(summary.results)

  html.push('    <h2>Results by Flow</h2>')
  flowGroups.forEach((tests, flow) => {
    html.push(...generateHtmlFlowSection(flow, tests))
  })

  const failedTests = summary.results.filter((r) => r.status === 'failed')
  html.push(...generateHtmlFailedTestsSection(failedTests))

  html.push(...generateHtmlFooter())

  return html.join('\n')
}

function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, (char) => map[char])
}

export async function generateReports(inputJsonPath: string, outputDir: string): Promise<void> {
  const summary = await parsePlaywrightResults(inputJsonPath)

  const markdownReport = generateMarkdownReport(summary)
  const htmlReport = generateHtmlReport(summary)

  const markdownPath = join(outputDir, 'report.md')
  const htmlPath = join(outputDir, 'report.html')

  await writeFile(markdownPath, markdownReport, 'utf-8')
  await writeFile(htmlPath, htmlReport, 'utf-8')

  console.log('Reports generated successfully', {
    markdown: markdownPath,
    html: htmlPath,
    summary: {
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      passRate: `${summary.passRate.toFixed(2)}%`,
    },
  })
}

const isMainModule = import.meta.url === `file://${process.argv[1]}`

if (isMainModule) {
  const currentDir = new URL('.', import.meta.url).pathname
  const inputPath = join(currentDir, '..', 'reports', 'test-results.json')
  const outputDir = join(currentDir, '..', 'reports')

  generateReports(inputPath, outputDir).catch((error) => {
    console.error('Failed to generate reports', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exit(1)
  })
}
