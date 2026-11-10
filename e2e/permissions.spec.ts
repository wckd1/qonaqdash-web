import type { Page } from '@playwright/test'
import { seedUser } from './fixtures/seed-users'
import { en, expect, login, test } from './fixtures/test'

// Each test signs in as its own seed user.
test.use({ storageState: { cookies: [], origins: [] } })

/** Employee id of a seed user, found through the API with the session of the page. */
async function employeeIdOf(page: Page, email: string): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  const res = await page.request.get('/api/employees', {
    headers: { Authorization: `Bearer ${token}` },
    params: { search: email },
  })
  expect(res.ok()).toBe(true)
  const found = ((await res.json()) as { id: string; email: string }[]).find(
    (e) => e.email === email,
  )
  if (!found) throw new Error(`No employee with email ${email}`)
  return found.id
}

/** Sets one permission in the open permissions dialog and saves; resolves with the response status. */
async function savePermission(page: Page, actionLabel: string, levelLabel: string) {
  const dialog = page.getByRole('dialog')
  await dialog
    .locator('.permission-matrix__row', { hasText: actionLabel })
    .locator('select')
    .selectOption({ label: levelLabel })
  const saved = page.waitForResponse(
    (r) => r.request().method() === 'PUT' && /\/permissions$/.test(new URL(r.url()).pathname),
  )
  await dialog.getByRole('button', { name: en.common.save }).click()
  return (await saved).status()
}

// WP2: the organization owner holds every permission, which nobody may change.
test("director sees the owner's permissions read-only", async ({ page }) => {
  await login(page, seedUser('director'))
  await page.goto(`/employees/${await employeeIdOf(page, seedUser('owner').email)}/details`)

  const access = page.locator('.employee-detail-access')
  await expect(access).toContainText(en.employees.owner_note)
  await expect(
    access.getByRole('button', { name: en.employees.manage_occupations_action }),
  ).toHaveCount(0)

  await access.getByRole('button', { name: en.employees.view_permissions_action }).click()
  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(en.employees.owner_note)
  await expect(dialog.getByRole('button', { name: en.common.save })).toHaveCount(0)
  await expect(dialog.locator('select:enabled')).toHaveCount(0)
  await dialog.getByRole('button', { name: en.common.close }).click()
  await expect(dialog).toHaveCount(0)
})

// WP2 B17: a permission manager cannot grant a permission they do not hold.
test('director cannot grant a permission above their own', async ({ page }) => {
  const director = seedUser('director')
  await login(page, director)
  await page.goto(`/employees/${await employeeIdOf(page, director.email)}/details`)

  await page.getByRole('button', { name: en.employees.manage_permissions_action }).click()
  // The director may view bookings, but not create them.
  const status = await savePermission(
    page,
    en.permissions.actions.bookings.create,
    en.permissions.level['2'],
  )

  expect(status).toBe(403)
  await expect(page.getByRole('dialog').getByRole('alert')).toContainText(
    `${en.permissions.areas.bookings}: ${en.permissions.actions.bookings.create}`,
  )
  await expect(page.locator('.toast')).toHaveCount(0)
})

// WP2: without employee rights the staff admin is not offered, and a direct link is refused.
test('housekeeper does not see the staff admin', async ({ page }) => {
  await login(page, seedUser('housekeeper'))

  await expect(
    page.locator('aside.sidebar').getByRole('link', { name: en.nav.employees, exact: true }),
  ).toHaveCount(0)

  await page.goto('/employees')
  await expect(page).toHaveURL(/\/forbidden/)
  await expect(page.locator('main.app-main')).toContainText(en.forbidden.message)
})
