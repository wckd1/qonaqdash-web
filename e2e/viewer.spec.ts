import type { Page } from '@playwright/test'
import { seedUser } from './fixtures/seed-users'
import { en, expect, login, test } from './fixtures/test'

// Each test signs in as the view-only role.
test.use({ storageState: { cookies: [], origins: [] } })

/** Opens the first booking of the list and checks that its detail shows. */
async function opensFirstBooking(page: Page): Promise<void> {
  await page.goto('/bookings')
  const row = page.locator('table.list-table tbody tr').first()
  await expect(row).toBeVisible()

  await row.getByRole('link', { name: en.common.details }).click()

  await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)
  await expect(page.locator('.form-content__viewport')).toBeVisible()
  await expect(page.locator('.error-message')).toHaveCount(0)
  // A view-only role does not edit bookings.
  await expect(page.getByRole('button', { name: en.common.edit, exact: true })).toHaveCount(0)
}

// F6: the "view only" role opens a booking.
test('viewer opens a booking', async ({ page }) => {
  await login(page, seedUser('viewer'))
  await opensFirstBooking(page)
})

// F6: the stored quote is a request of its own; a 403 on it does not break the booking.
test('viewer opens a booking when the stored quote is forbidden', async ({ page }) => {
  await page.route('**/api/pricing/bookings/*/quote', (route) =>
    route.fulfill({
      status: 403,
      json: { error: { code: 'common.forbidden', message: 'forbidden' } },
    }),
  )
  await login(page, seedUser('viewer'))
  await opensFirstBooking(page)
})
