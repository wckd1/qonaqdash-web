import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { makeToken } from '@/test-utils/jwt'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'
const PERMISSIONS_KEY = 'qonaqdash.account.permissions'

/**
 * Simulates a page load: a fresh router and Pinia, so the auth store re-reads
 * localStorage and the first navigation runs the guard.
 */
async function reloadApp() {
  vi.resetModules()
  const { createPinia, setActivePinia } = await import('pinia')
  setActivePinia(createPinia())
  const { default: router } = await import('@/router')
  return router
}

beforeEach(() => {
  localStorage.clear()
})

// Logout resets other stores through dynamic imports; let them finish inside the test.
afterEach(() => vi.dynamicImportSettled())

describe('router guard: session on page load', () => {
  test('keeps the session when the access token is live', async () => {
    const access = makeToken('access', 600)
    const refresh = makeToken('refresh', 3600)
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, refresh)
    localStorage.setItem(PERMISSIONS_KEY, JSON.stringify({ bookings: { view: 1 } }))
    const router = await reloadApp()

    await router.push('/bookings')

    expect(router.currentRoute.value.name).toBe('bookings')
    expect(localStorage.getItem(ACCESS_KEY)).toBe(access)
    expect(localStorage.getItem(REFRESH_KEY)).toBe(refresh)
  })

  test('sends the user to login when both tokens have expired', async () => {
    localStorage.setItem(ACCESS_KEY, makeToken('access', -60))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', -60))
    const router = await reloadApp()

    await router.push('/bookings')

    expect(router.currentRoute.value.name).toBe('login')
    expect(router.currentRoute.value.query.redirect).toBe('/bookings')
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
  })

  // F1, fixed in WP6: a reload with an expired access token logs the user out
  // and deletes the refresh token, although it is still valid.
  test.fails('keeps a live refresh token when the access token has expired', async () => {
    const refresh = makeToken('refresh', 3600)
    localStorage.setItem(ACCESS_KEY, makeToken('access', -60))
    localStorage.setItem(REFRESH_KEY, refresh)
    const router = await reloadApp()

    await router.push('/bookings')

    expect(localStorage.getItem(REFRESH_KEY)).toBe(refresh)
  })
})
