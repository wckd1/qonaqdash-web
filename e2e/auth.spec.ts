import { SEED_USERS, requireMainUser, seedUser } from './fixtures/seed-users'
import { en, expect, login, logout, openFromSidebar, submitLogin, test } from './fixtures/test'

// Each test starts without a session.
test.use({ storageState: { cookies: [], origins: [] } })

test('logs in with a seed user', async ({ page }) => {
  await login(page, requireMainUser())
})

test('logs out', async ({ page }) => {
  await login(page, requireMainUser())

  await logout(page)

  await page.goto('/bookings')
  await expect(page).toHaveURL(/\/auth\/login\?redirect=/)
})

for (const user of SEED_USERS) {
  test(`logs in as ${user.role}`, async ({ page }) => {
    await login(page, user)
  })
}

// F2: after a logout, the next user in the same tab sees none of the previous
// user's data. The owner works in Qonaq City Hotel, the director in Qonaq
// Mountain Lodge, and each hotel has its own base rates.
test('shows no data of the previous user after logging in as another user', async ({ page }) => {
  const rateInputs = page.locator('.base-rates__amount-input')
  async function openBaseRates(): Promise<void> {
    await openFromSidebar(page, en.nav.pricing)
    await page.getByRole('link', { name: en.pricing.tab_base_rates }).click()
    await expect(rateInputs.first()).toBeVisible()
  }

  await login(page, seedUser('owner'))
  await openBaseRates()

  await logout(page)
  await submitLogin(page, seedUser('director'))
  await openBaseRates()

  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  const { rates } = (await (
    await page.request.get('/api/pricing/base-rates', {
      headers: { Authorization: `Bearer ${token}` },
    })
  ).json()) as { rates: { base_rate_minor: number }[] }
  // Rates are shown in major units; the demo currencies have two decimals.
  const expected = rates.map((r) => String(r.base_rate_minor / 100)).sort()
  await expect
    .poll(async () =>
      (
        await rateInputs.evaluateAll((els) => els.map((el) => (el as HTMLInputElement).value))
      ).sort(),
    )
    .toEqual(expected)
})
