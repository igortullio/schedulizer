import { test, expect } from '@playwright/test'
import { cleanupTestData } from '../helpers/db'

const API_BASE_URL = 'http://localhost:3000'

test.describe('Scheduling', () => {
  test.afterAll(async () => {
    await cleanupTestData('e2e-')
  })

  test.skip('should create appointment via customer booking form', async () => {
    // TODO: Depends on magic link authentication (see 01-auth.spec.ts)
    // Will test:
    // 1. Navigate to booking page
    // 2. Fill customer details (name, email, phone)
    // 3. Select service from available services
    // 4. Select available time slot
    // 5. Submit booking form
    // 6. Verify appointment created via API GET /api/appointments
    // 7. Verify appointment status is 'pending'
  })

  test.skip('should create appointment via dashboard admin form', async () => {
    // TODO: Depends on magic link authentication + organization context
    // Will test:
    // 1. Authenticate as organization admin
    // 2. Navigate to /dashboard/appointments
    // 3. Click "Create Appointment" button
    // 4. Fill appointment form (customer details, service, datetime)
    // 5. Submit form
    // 6. Verify appointment appears in list
    // 7. Verify API response matches UI data
  })

  test.skip('should list appointments in calendar view', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test:
    // 1. Authenticate as organization member
    // 2. Create test appointments via API for current week
    // 3. Navigate to /dashboard/appointments?view=calendar
    // 4. Verify appointments appear in calendar grid
    // 5. Test calendar navigation (prev/next week)
    // 6. Test filtering by status (pending, confirmed, completed)
  })

  test.skip('should list appointments in list view', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test:
    // 1. Authenticate as organization member
    // 2. Create multiple test appointments via API
    // 3. Navigate to /dashboard/appointments?view=list
    // 4. Verify appointments appear in list
    // 5. Test pagination (if applicable)
    // 6. Test status filtering
    // 7. Test date range filtering
  })

  test.skip('should view appointment details', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test:
    // 1. Authenticate as organization member
    // 2. Create test appointment via API
    // 3. Navigate to appointment details page
    // 4. Verify all appointment fields are displayed:
    //    - Customer name, email, phone
    //    - Service name and duration
    //    - Start/end datetime
    //    - Status
    //    - Notes
  })

  test.skip('should edit appointment details', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test:
    // 1. Authenticate as organization member
    // 2. Create test appointment via API
    // 3. Navigate to appointment edit page
    // 4. Update customer notes
    // 5. Change appointment datetime
    // 6. Submit changes
    // 7. Verify updates via API GET /api/appointments/:id
  })

  test.skip('should confirm pending appointment', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test status transition: pending → confirmed
    // 1. Authenticate as organization member
    // 2. Create test appointment with status 'pending' via API
    // 3. Navigate to appointment details
    // 4. Click "Confirm" button
    // 5. Verify API call to POST /api/appointments/:id/confirm
    // 6. Verify status updated to 'confirmed'
    // 7. Verify UI reflects new status
  })

  test.skip('should complete confirmed appointment', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test status transition: confirmed → completed
    // 1. Authenticate as organization member
    // 2. Create test appointment with status 'confirmed' via API
    // 3. Navigate to appointment details
    // 4. Click "Complete" button
    // 5. Verify API call to POST /api/appointments/:id/complete
    // 6. Verify status updated to 'completed'
  })

  test.skip('should cancel appointment', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test status transition: pending/confirmed → cancelled
    // 1. Authenticate as organization member
    // 2. Create test appointment with status 'pending' via API
    // 3. Navigate to appointment details
    // 4. Click "Cancel" button
    // 5. Confirm cancellation in dialog
    // 6. Verify API call to POST /api/appointments/:id/cancel
    // 7. Verify status updated to 'cancelled'
  })

  test.skip('should mark appointment as no-show', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test status transition: confirmed → no_show
    // 1. Authenticate as organization member
    // 2. Create test appointment with status 'confirmed' via API
    // 3. Navigate to appointment details
    // 4. Click "Mark as No-Show" button
    // 5. Verify API call to POST /api/appointments/:id/no-show
    // 6. Verify status updated to 'no_show'
  })

  test.skip('should reject invalid status transitions', async () => {
    // TODO: Depends on magic link authentication + test data setup
    // Will test that invalid transitions are blocked
    // Test cases:
    // - completed → pending (should fail)
    // - cancelled → confirmed (should fail)
    // - no_show → pending (should fail)
    // Verify API returns 422 with error code 'INVALID_TRANSITION'
  })

  test.skip('should validate multi-tenancy isolation', async () => {
    // TODO: Depends on magic link authentication + multiple org setup
    // Will test that appointments are scoped to organizationId
    // 1. Create two test organizations (org A, org B)
    // 2. Authenticate as member of org A
    // 3. Create appointment in org A via API
    // 4. Switch to org B context
    // 5. Verify appointment from org A is NOT visible
    // 6. List appointments via API
    // 7. Verify only org B appointments are returned
  })

  test.skip('should handle invalid datetime format error', async () => {
    // TODO: Depends on magic link authentication
    // Will test validation of datetime fields
    // 1. Authenticate as organization member
    // 2. Attempt to create appointment with invalid datetime format
    // 3. Verify API returns 400 with validation error
    // 4. Verify UI displays error message
  })

  test.skip('should handle booking outside service schedule error', async () => {
    // TODO: Depends on magic link authentication + schedule setup
    // Will test validation against service availability
    // 1. Authenticate as organization member
    // 2. Create service with specific schedule (Mon-Fri 9am-5pm)
    // 3. Attempt to book appointment on Saturday or at 8pm
    // 4. Verify API returns 422 with error code indicating schedule conflict
    // 5. Verify UI displays appropriate error message
  })

  test.skip('should handle missing required fields error', async () => {
    // TODO: Depends on magic link authentication
    // Will test validation of required fields
    // Test cases:
    // - Missing customer name
    // - Missing customer email
    // - Missing customer phone
    // - Missing service selection
    // - Missing datetime
    // Verify API returns 400 with validation errors
    // Verify UI displays field-specific error messages
  })

  test('should verify API endpoints are accessible', async ({ request }) => {
    const endpoints = [
      { method: 'GET', path: '/api/appointments', expectedStatus: 401 },
      { method: 'GET', path: '/api/appointments/test-id', expectedStatus: 401 },
    ]

    for (const endpoint of endpoints) {
      const response = await request.fetch(`${API_BASE_URL}${endpoint.path}`, {
        method: endpoint.method,
      })

      expect(response.status()).toBe(endpoint.expectedStatus)
    }
  })

  test('should verify appointment status transition endpoints exist', async ({ request }) => {
    const appointmentId = 'test-appointment-id'
    const transitionEndpoints = [
      `/api/appointments/${appointmentId}/confirm`,
      `/api/appointments/${appointmentId}/complete`,
      `/api/appointments/${appointmentId}/cancel`,
      `/api/appointments/${appointmentId}/no-show`,
    ]

    for (const endpoint of transitionEndpoints) {
      const response = await request.fetch(`${API_BASE_URL}${endpoint}`, {
        method: 'POST',
      })

      expect(response.status()).toBe(401)
    }
  })
})
