import { MAIN_USER_STATE, en, expect, test } from './fixtures/test'

test.use({ storageState: MAIN_USER_STATE })

test('saves a base rate', async ({ page }) => {
  await page.goto('/manage/pricing/base-rates')
  await expect(page.getByRole('heading', { name: en.pricing.base_rates_title })).toBeVisible()

  const firstRate = page.locator('.base-rates__amount-input').first()
  await expect(firstRate).toBeVisible()
  const original = await firstRate.inputValue()
  const changed = String(Number(original) + 1)
  const save = page.getByRole('button', { name: en.common.save, exact: true })

  async function saveRate(value: string): Promise<void> {
    await firstRate.fill(value)
    const saved = page.waitForResponse(
      (r) => r.request().method() === 'PUT' && r.url().includes('/api/pricing/base-rates'),
    )
    await save.click()
    expect((await saved).ok()).toBe(true)
    await expect(save).toBeDisabled()
    await expect(firstRate).toHaveValue(value)
  }

  await saveRate(changed)
  await page.reload()
  await expect(firstRate).toHaveValue(changed)

  await saveRate(original)
  await expect(page.locator('.form-error')).toHaveCount(0)
})
