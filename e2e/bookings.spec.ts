import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

/** `YYYY-MM-DDTHH:mm` for a datetime-local input, `days` from today. */
function datetimeLocal(days: number, time: string): string {
  const d = new Date()
  d.setDate(d.getDate() + days)
  const ymd = [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, '0'),
    String(d.getDate()).padStart(2, '0'),
  ].join('-')
  return `${ymd}T${time}`
}

test('opens an existing booking', async ({ page }) => {
  await page.goto('/bookings')

  const row = page.locator('table.list-table tbody tr').first()
  await expect(row).toBeVisible()
  const guestName = (await row.locator('td').first().innerText()).trim()

  await row.getByRole('link', { name: en.common.details }).click()

  await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)
  await expect(page.locator('.form-content__viewport')).toBeVisible()
  if (guestName && guestName !== '—') {
    await expect(page.getByRole('heading', { level: 1 })).toContainText(guestName)
  }
  await expect(page.locator('.error-message')).toHaveCount(0)
})

test('creates a new booking', async ({ page }) => {
  const runId = Date.now().toString(36)
  const firstName = 'Smoke'
  const lastName = `E2E ${runId}`
  // Far in the future so the stay does not collide with seed bookings or earlier runs.
  const startInDays = 365 + Math.floor(Math.random() * 365)

  await page.goto('/bookings/new')
  await expect(
    page.getByRole('heading', { level: 1, name: en.page_title.booking_new }),
  ).toBeVisible()

  await page.getByLabel(en.fields.last_name).fill(lastName)
  await page.getByLabel(en.fields.first_name).fill(firstName)
  await page.getByLabel(en.fields.email).fill(`e2e-${runId}@example.test`)
  await page.getByLabel(en.fields.check_in).fill(datetimeLocal(startInDays, '14:00'))
  await page.getByLabel(en.fields.check_out).fill(datetimeLocal(startInDays + 2, '12:00'))

  const roomType = page.getByLabel(en.fields.room_type)
  const firstRoomType = roomType.locator('option:not([value=""])').first()
  await expect(firstRoomType).toBeAttached()
  await roomType.selectOption((await firstRoomType.getAttribute('value')) ?? '')

  await page.getByRole('button', { name: en.common.save, exact: true }).click()

  await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)
  await expect(page.getByRole('heading', { level: 1 })).toContainText(`${firstName} ${lastName}`)
  await expect(page.locator('.error-message')).toHaveCount(0)
})
