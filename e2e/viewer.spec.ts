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

// WP2 B8: the stored quote is readable with `bookings.view` alone.
test('a role with only bookings.view sees the stored quote of a booking', async ({ page }) => {
  // The housekeeper may view bookings, but has no pricing or billing rights.
  await login(page, seedUser('housekeeper'))
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  const bookings = (await (
    await page.request.get('/api/bookings', { headers: { Authorization: `Bearer ${token}` } })
  ).json()) as { id: string; status: string }[]
  // The accommodation summary shows until check-in.
  const confirmed = bookings.find((b) => b.status === 'confirmed')
  if (!confirmed) throw new Error('The demo seed has no confirmed booking')

  const quote = page.waitForResponse(
    (r) => new URL(r.url()).pathname === `/api/pricing/bookings/${confirmed.id}/quote`,
  )
  await page.goto(`/bookings/${confirmed.id}/details`)

  expect((await quote).status()).toBe(200)
  await expect(page.getByRole('heading', { name: en.bookings.accommodation_title })).toBeVisible()
  await expect(page.locator('.error-message')).toHaveCount(0)
})
