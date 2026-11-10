import { requireMainUser } from './fixtures/seed-users'
import { MAIN_USER_STATE, login, test } from './fixtures/test'

test('log in as the main user', async ({ page }) => {
  await login(page, requireMainUser())
  await page.context().storageState({ path: MAIN_USER_STATE })
})
