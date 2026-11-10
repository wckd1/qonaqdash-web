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
