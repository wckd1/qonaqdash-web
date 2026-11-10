import type { Page } from '@playwright/test'
import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

// The main seed user is the organization owner.
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

async function apiHeaders(page: Page): Promise<Record<string, string>> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  return { Authorization: `Bearer ${token}` }
}

function isRequest(method: string, path: RegExp) {
  return (r: { request(): { method(): string }; url(): string }) =>
    r.request().method() === method && path.test(new URL(r.url()).pathname)
}

// WP0-B1, WP2: the owner sets up the hotel with the permissions of the organization owner only.
test('owner sets up the hotel: room type, room, base rate and a booking', async ({ page }) => {
  const runId = Date.now().toString(36)
  const typeName = `E2E type ${runId}`
  const roomNumber = `E2E-${runId}`
  // Base rate in major units; the demo currencies have two decimals.
  const rate = 123
  const created: { roomTypeId?: string; roomId?: string; bookingId?: string } = {}

  try {
    await page.goto('/manage/rooms')
    await page.getByRole('button', { name: en.rooms.add_type_aria }).click()
    const typeDialog = page.getByRole('dialog')
    await typeDialog.getByLabel(en.fields.name).fill(typeName)
    const typeSaved = page.waitForResponse(isRequest('POST', /^\/api\/property\/room-types$/))
    await typeDialog.getByRole('button', { name: en.common.add }).click()
    const typeResponse = await typeSaved
    expect(typeResponse.status()).toBe(201)
    created.roomTypeId = ((await typeResponse.json()) as { id: string }).id

    await page
      .getByRole('button', { name: en.rooms.add_room_aria.replace('{name}', typeName) })
      .click()
    const roomDialog = page.getByRole('dialog')
    await roomDialog.getByLabel(en.fields.room_number).fill(roomNumber)
    const roomSaved = page.waitForResponse(isRequest('POST', /^\/api\/property\/rooms$/))
    await roomDialog.getByRole('button', { name: en.common.add }).click()
    const roomResponse = await roomSaved
    expect(roomResponse.status()).toBe(201)
    created.roomId = ((await roomResponse.json()) as { id: string }).id

    await page.goto('/manage/pricing/base-rates')
    const rateRow = page.locator('tr', { hasText: typeName })
    await rateRow.locator('.base-rates__amount-input').fill(String(rate))
    const ratesSaved = page.waitForResponse(isRequest('PUT', /^\/api\/pricing\/base-rates$/))
    await page.getByRole('button', { name: en.common.save, exact: true }).click()
    expect((await ratesSaved).ok()).toBe(true)

    // Far in the future so the stay does not collide with seed bookings or earlier runs.
    const startInDays = 365 + Math.floor(Math.random() * 365)
    await page.goto('/bookings/new')
    await expect(
      page.getByRole('heading', { level: 1, name: en.page_title.booking_new }),
    ).toBeVisible()
    await page.getByLabel(en.fields.last_name).fill(`Owner ${runId}`)
    await page.getByLabel(en.fields.first_name).fill('Smoke')
    await page.getByLabel(en.fields.email).fill(`e2e-owner-${runId}@example.test`)
    await page.getByLabel(en.fields.check_in).fill(datetimeLocal(startInDays, '14:00'))
    await page.getByLabel(en.fields.check_out).fill(datetimeLocal(startInDays + 2, '12:00'))
    // The price of the stay comes from the new base rate: two nights.
    const quoted = page.waitForResponse(
      async (r) =>
        isRequest('POST', /^\/api\/pricing\/quote$/)(r) &&
        r.ok() &&
        ((await r.json()) as { nights_subtotal?: number }).nights_subtotal === rate * 100 * 2,
    )
    await page.getByLabel(en.fields.room_type).selectOption({ label: typeName })
    await quoted

    const bookingSaved = page.waitForResponse(isRequest('POST', /^\/api\/bookings$/))
    await page.getByRole('button', { name: en.common.save, exact: true }).click()
    const bookingResponse = await bookingSaved
    expect(bookingResponse.status()).toBe(201)
    created.bookingId = ((await bookingResponse.json()) as { id: string }).id

    await expect(page).toHaveURL(/\/bookings\/[^/]+\/details$/)
    await expect(page.locator('.error-message')).toHaveCount(0)
  } finally {
    // Leave the demo hotel as it was: the canceled booking stays, the room and the type go.
    const headers = await apiHeaders(page)
    if (created.bookingId) {
      await page.request.put(`/api/bookings/${created.bookingId}/cancel`, { headers })
    }
    if (created.roomId) {
      await page.request.delete(`/api/property/rooms/${created.roomId}`, { headers })
    }
    if (created.roomTypeId) {
      await page.request.delete(`/api/property/room-types/${created.roomTypeId}`, { headers })
    }
  }
})
