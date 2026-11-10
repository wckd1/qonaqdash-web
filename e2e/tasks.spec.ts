import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

test('lists housekeeping tasks and changes a task status', async ({ page }) => {
  const description = `E2E task ${Date.now().toString(36)}`

  await page.goto('/tasks/housekeeping')
  const rows = page.locator('table.list-table tbody tr')
  await expect(rows.first()).toBeVisible()

  // A room takes one open task at a time; seed data and earlier runs occupy
  // some rooms, so try them in order. The test cancels its task at the end.
  await page.getByRole('button', { name: en.tasks.create_aria }).click()
  const dialog = page.getByRole('dialog')
  const room = dialog.getByLabel(en.fields.room_number)
  await dialog.getByLabel(en.tasks.col_description).fill(description)
  const roomIds = await room
    .locator('option:not([value=""])')
    .evaluateAll((options) => options.map((o) => (o as HTMLOptionElement).value))
  for (const roomId of roomIds) {
    await room.selectOption(roomId)
    const created = page.waitForResponse(
      (r) => r.request().method() === 'POST' && r.url().includes('/api/tasks/housekeeping'),
    )
    await dialog.getByRole('button', { name: en.common.add }).click()
    if ((await created).ok()) break
  }
  await expect(dialog).toHaveCount(0)

  const row = rows.filter({ hasText: description })
  await expect(row).toHaveCount(1)
  await expect(row).toContainText(en.tasks.status.open)

  await row.click()
  const panel = page.locator('.side-panel')
  await panel.getByRole('button', { name: en.tasks.status_action.in_progress }).click()
  await expect(row).toContainText(en.tasks.status.in_progress)
  await expect(panel).toContainText(en.tasks.status.in_progress)

  await panel.getByRole('button', { name: en.tasks.status_action.canceled }).click()
  await expect(row).toContainText(en.tasks.status.canceled)
})
