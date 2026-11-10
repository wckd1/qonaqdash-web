import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

/** Keys the server adds to employee responses; writes must not send them back. */
const SERVER_KEYS = [
  'id',
  '_form',
  'blocked',
  'effective_permissions',
  'permission_overrides',
  'occupation_ids',
  'occupations',
  'is_owner',
]

test('creates an employee, opens it and saves only profile fields', async ({ page }) => {
  const runId = Date.now().toString(36)
  const lastName = `E2E ${runId}`

  await page.goto('/employees/new')
  await page.getByLabel(en.fields.last_name).fill(lastName)
  await page.getByLabel(en.fields.first_name).fill('Smoke')
  await page.getByLabel(en.fields.email).fill(`e2e-employee-${runId}@example.test`)
  await page.getByRole('button', { name: en.common.save, exact: true }).click()

  const dialog = page.getByRole('dialog')
  await expect(dialog).toContainText(en.employees.invite_ready_title)
  await dialog.getByRole('button', { name: en.employees.open_employee }).click()

  await expect(page).toHaveURL(/\/employees\/[0-9a-f-]{36}\/details$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Smoke ${lastName}`)

  await page.getByRole('button', { name: en.common.edit, exact: true }).click()
  await page.getByLabel(en.fields.first_name).fill('Edited')
  const saved = page.waitForRequest(
    (r) => r.method() === 'PUT' && /\/api\/employees\/[^/]+$/.test(new URL(r.url()).pathname),
  )
  await page.getByRole('button', { name: en.common.save, exact: true }).click()
  const body = (await saved).postDataJSON() as Record<string, unknown>

  expect(body).toMatchObject({ first_name: 'Edited', last_name: lastName })
  expect(Object.keys(body).filter((key) => SERVER_KEYS.includes(key))).toEqual([])
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Edited ${lastName}`)
})
