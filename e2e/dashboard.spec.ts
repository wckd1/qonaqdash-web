import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

test('opens the dashboard', async ({ page }) => {
  await page.goto('/')

  await expect(page.getByRole('heading', { level: 1, name: en.dashboard.title })).toBeVisible()
  await expect(page.locator('.reservation-grid-root')).toBeVisible()
  await expect(page.locator('.reservation-grid-label-num').first()).toBeVisible()
  await expect(page.locator('.dashboard-view .error-message')).toHaveCount(0)
})
