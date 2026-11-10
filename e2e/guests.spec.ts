import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

test('lists, searches and opens guests', async ({ page }) => {
  await page.goto('/guests')

  const rows = page.locator('table.list-table tbody tr')
  await expect(rows.first()).toBeVisible()
  const lastName = (await rows.first().locator('td').nth(1).innerText()).trim()
  expect(lastName).not.toBe('—')

  const searched = page.waitForResponse(
    (r) => r.url().includes('/api/guests?') && r.url().includes('q='),
  )
  await page.getByLabel(en.guests.search_aria).fill(lastName)
  await searched
  await expect
    .poll(async () => {
      const texts = await rows.allInnerTexts()
      return (
        texts.length > 0 && texts.every((t) => t.toLowerCase().includes(lastName.toLowerCase()))
      )
    })
    .toBe(true)

  await rows.first().click()
  await expect(page).toHaveURL(/\/guests\/[^/]+$/)
  await expect(page.locator('.side-panel')).toContainText(lastName)

  await page.locator('.side-panel').getByRole('link', { name: en.common.open_full_page }).click()
  await expect(page).toHaveURL(/\/guests\/[^/]+\/details$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(lastName)
  await expect(page.locator('.error-message')).toHaveCount(0)
})

// Contract criterion 4a: the server owns id, blocked and _form of a guest.
test('saves only profile fields when editing a guest', async ({ page }) => {
  const runId = Date.now().toString(36)
  const lastName = `E2E ${runId}`

  await page.goto('/guests/new')
  await page.getByLabel(en.fields.last_name).fill(lastName)
  await page.getByLabel(en.fields.first_name).fill('Smoke')
  await page.getByLabel(en.fields.email).fill(`e2e-guest-${runId}@example.test`)
  await page.getByRole('button', { name: en.common.save, exact: true }).click()
  await expect(page).toHaveURL(/\/guests$/)

  const row = page.locator('table.list-table tbody tr', { hasText: lastName })
  await row.getByRole('link', { name: en.common.details }).click()
  await page.getByRole('button', { name: en.common.edit, exact: true }).click()
  await page.getByLabel(en.fields.first_name).fill('Edited')
  const saved = page.waitForRequest(
    (r) => r.method() === 'PUT' && /\/api\/guests\/[^/]+$/.test(new URL(r.url()).pathname),
  )
  await page.getByRole('button', { name: en.common.save, exact: true }).click()
  const body = (await saved).postDataJSON() as Record<string, unknown>

  expect(body).toMatchObject({ first_name: 'Edited', last_name: lastName })
  expect(Object.keys(body).filter((key) => ['id', 'blocked', '_form'].includes(key))).toEqual([])
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`Edited ${lastName}`)
})

// F4 (review): a 400 with `fields` shows its message next to those fields, without a toast.
test('shows a server field error next to the fields', async ({ page }) => {
  await page.goto('/guests/new')
  // No email and no phone: the server requires one of them (`guest.contact_required`).
  await page.getByLabel(en.fields.last_name).fill(`E2E ${Date.now().toString(36)}`)
  await page.getByLabel(en.fields.first_name).fill('Smoke')
  const rejected = page.waitForResponse(
    (r) => r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/guests',
  )
  await page.getByRole('button', { name: en.common.save, exact: true }).click()
  expect((await rejected).status()).toBe(400)

  for (const label of [en.fields.email, en.fields.phone]) {
    const control = page.locator('.form-edit-control', { has: page.getByLabel(label) })
    await expect(control.locator('.form-field-error')).toHaveText(en.errors.guest.contact_required)
  }
  await expect(page.locator('.toast')).toHaveCount(0)
  await expect(page).toHaveURL(/\/guests\/new$/)
})

// F4 (review): Save showed nothing when the server reported a field the form does not show.
test('shows a server validation error of a field the form does not show', async ({ page }) => {
  await page.route('**/api/guests', (route) =>
    route.request().method() === 'POST'
      ? route.fulfill({
          status: 422,
          json: {
            error: {
              code: 'common.validation_failed',
              message: 'validation failed',
              issues: [
                { code: 'validation.required', message: 'required', fields: ['passport_number'] },
              ],
            },
          },
        })
      : route.fallback(),
  )
  await page.goto('/guests/new')
  await page.getByLabel(en.fields.last_name).fill(`E2E ${Date.now().toString(36)}`)
  await page.getByLabel(en.fields.first_name).fill('Smoke')
  await page.getByLabel(en.fields.email).fill('e2e-hidden-field@example.test')
  await page.getByRole('button', { name: en.common.save, exact: true }).click()

  await expect(page.locator('.form-edit__root-errors')).toHaveText('required')
  await expect(page).toHaveURL(/\/guests\/new$/)
})
