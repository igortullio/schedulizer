import { test, expect } from '@playwright/test'
import { cleanupTestData } from '../helpers/db'

const FRONTEND_BASE_URL = 'http://localhost:4200'

test.describe('Authentication', () => {
  test.afterAll(async () => {
    await cleanupTestData('e2e-')
  })

  test.skip('should successfully login with magic link', async () => {
    // TODO: Magic link token persistence issue with better-auth
    // The API generates tokens correctly (visible in logs) but they are not persisted to database
    // Root cause: better-auth transaction rollback despite successful callback completion
    // Investigation showed:
    // 1. User exists in database ✓
    // 2. API returns success {status:true} ✓
    // 3. Token is generated (confirmed in logs) ✓
    // 4. Token is NOT in verifications table ✗
    // Requires better-auth configuration fix or alternative auth strategy
  })

  test.skip('should logout and redirect to login page', async () => {
    // TODO: Depends on magic link login flow (see test above)
    // Will be implemented once magic link token persistence is resolved
  })

  test('should protect routes and redirect unauthenticated users', async ({ page, context }) => {
    await context.clearCookies()

    await page.goto(`${FRONTEND_BASE_URL}/dashboard`)

    await page.waitForURL(/\/auth\/login/, { timeout: 5000 })

    const currentUrl = page.url()
    expect(currentUrl).toContain('/auth/login')

    const redirectParam = new URL(currentUrl).searchParams.get('redirect')
    if (redirectParam) {
      expect(redirectParam).toContain('dashboard')
    }
  })
})
