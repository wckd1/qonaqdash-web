import type { Page } from '@playwright/test'
import { MAIN_USER_STATE, en, expect, openFromSidebar, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

interface HotelSettings {
  name: string
  currency: string
  check_in_hour: string
  check_out_hour: string
}

async function apiHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  return { Authorization: `Bearer ${token}` }
}

// Known bug F8, fixed in WP1 by invalidating the hotel query on save.
// F8: the hotel data other screens use is refreshed after the settings are saved.
test.fail('saved hotel settings show on other screens without a reload', async ({ page }) => {
  await page.goto('/manage/hotel')
  await expect(page.getByRole('heading', { level: 1, name: en.hotel.title })).toBeVisible()
  const original = (await (
    await page.request.get('/api/property/hotel', { headers: await apiHeaders(page) })
  ).json()) as HotelSettings
  const currency = original.currency === 'USD' ? 'EUR' : 'USD'
  const checkInHour = original.check_in_hour === '15:30' ? '16:30' : '15:30'

  try {
    await page.getByLabel(en.hotel.currency).selectOption(currency)
    await page
      .getByRole('dialog')
      .getByRole('button', { name: en.hotel.confirm_currency_proceed })
      .click()
    await page.getByLabel(en.hotel.check_in_hour).fill(checkInHour)
    const saved = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes('/api/property/hotel'),
    )
    await page.getByRole('button', { name: en.common.save, exact: true }).click()
    expect((await saved).ok()).toBe(true)

    await openFromSidebar(page, en.nav.pricing)
    await expect(page.locator('.pricing-chrome__currency')).toContainText(currency)

    await openFromSidebar(page, en.nav.bookings)
    await page.getByRole('link', { name: en.bookings.new_booking }).first().click()
    await expect(page.getByLabel(en.fields.check_in)).toHaveValue(new RegExp(`T${checkInHour}$`))
  } finally {
    await page.request.put('/api/property/hotel', {
      headers: await apiHeaders(page),
      data: {
        name: original.name,
        currency: original.currency,
        check_in_hour: original.check_in_hour,
        check_out_hour: original.check_out_hour,
      },
    })
  }
})
