import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

const periodSelect = { name: en.billing.preset_label }

test('opens reports and changes the period', async ({ page }) => {
  await page.goto('/manage/reports')
  await expect(
    page.getByRole('heading', { level: 1, name: en.billing.reports_title }),
  ).toBeVisible()
  await expect(page.getByText(en.billing.revenue_accommodation)).toBeVisible()

  const reloaded = page.waitForResponse((r) => r.url().includes('/api/billing/reports/overview'))
  await page.getByRole('combobox', { name: periodSelect.name, exact: true }).selectOption('last_90')
  expect((await reloaded).ok()).toBe(true)
  await expect(page.getByText(en.billing.revenue_accommodation)).toBeVisible()
  await expect(page.locator('.reports-view .error-message')).toHaveCount(0)
})

// Known bug F7 (race part), fixed in WP1 by Pinia Colada query keys per period.
// F7: a slow response for the previous period must not replace the data of
// the period selected after it.
test.fail('shows the data of the last selected period', async ({ page }) => {
  const overview = (accommodation: number) => ({
    period: { from: '2026-01-01', to: '2026-02-01' },
    accommodation,
    rule_adjustments: 0,
    manual_adjustments: 0,
    service_charges: 0,
    total_charges: accommodation,
    payments: 0,
    refunds: 0,
    corrections: 0,
    total_outstanding: 0,
  })
  let calls = 0
  let releaseFirst: () => void = () => {}
  const firstReleased = new Promise<void>((resolve) => (releaseFirst = resolve))
  let firstDone: () => void = () => {}
  const firstFulfilled = new Promise<void>((resolve) => (firstDone = resolve))
  await page.route('**/api/billing/reports/overview?*', async (route) => {
    calls += 1
    if (calls === 1) {
      await firstReleased
      await route.fulfill({ json: overview(111_111) })
      firstDone()
    } else {
      await route.fulfill({ json: overview(999_999) })
    }
  })

  await page.goto('/manage/reports')
  const accommodation = page
    .locator('.pricing-card__row', { hasText: en.billing.revenue_accommodation })
    .first()
  await expect.poll(() => calls).toBe(1)
  await page.getByRole('combobox', { name: periodSelect.name, exact: true }).selectOption('last_90')
  await expect(accommodation).toContainText('9,999.99')

  releaseFirst()
  await firstFulfilled
  // Give the stale response time to reach the screen.
  await page.waitForTimeout(300)
  await expect(accommodation).toContainText('9,999.99')
})
