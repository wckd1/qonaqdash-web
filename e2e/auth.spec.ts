import { SEED_USERS, requireMainUser } from './fixtures/seed-users'
import { expect, login, logout, test } from './fixtures/test'

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
