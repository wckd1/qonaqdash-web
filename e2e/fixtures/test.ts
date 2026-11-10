import { fileURLToPath } from 'node:url'
import { expect, test as base, type Page } from '@playwright/test'
import en from '../../src/locales/en.json' with { type: 'json' }
import type { SeedUser } from './seed-users'

export { en, expect }

/** Session of the main user, saved by auth.setup.ts. */
export const MAIN_USER_STATE = fileURLToPath(new URL('../.auth/main-user.json', import.meta.url))

/** Pins the UI to English so selectors can use strings from en.json. */
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('qd_locale', 'en')
      } catch {
        // storage is unavailable on about:blank
      }
    })
    await use(page)
  },
})

export async function login(page: Page, user: SeedUser): Promise<void> {
  await page.goto('/auth/login')
  await submitLogin(page, user)
}

/**
 * Logs in from the login page that is already open, without reloading it.
 * After a logout this keeps the same SPA session, as a user would.
 */
export async function submitLogin(page: Page, user: SeedUser): Promise<void> {
  await page.getByLabel(en.auth.login.email).fill(user.email)
  await page.getByLabel(en.auth.login.password).fill(user.password)
  await page.getByRole('button', { name: en.auth.login.sign_in }).click()
  // Roles land on different home screens; any screen they may open counts.
  await expect(page).not.toHaveURL(/\/auth\/login/)
  await expect(page).not.toHaveURL(/\/forbidden/)
  await expect(page.locator('main.app-main')).toBeVisible()
}

export async function logout(page: Page): Promise<void> {
  await page.locator('.sidebar-user .user-trigger').click()
  await page.getByRole('button', { name: en.layout.logout }).click()
  await expect(page).toHaveURL(/\/auth\/login/)
}

/**
 * Opens a screen through the sidebar, without a page reload, so data cached in
 * the SPA stays in place. Management links sit in a collapsible group.
 */
export async function openFromSidebar(page: Page, label: string): Promise<void> {
  const sidebar = page.locator('aside.sidebar')
  const link = sidebar.getByRole('link', { name: label, exact: true })
  if (!(await link.isVisible())) {
    await sidebar.locator('summary', { hasText: en.nav.management }).click()
  }
  await link.click()
}
