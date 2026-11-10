import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useQueryCache } from '@pinia/colada'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import type { AccountBundleResponse } from '@/features/auth/api'
import { makeJwt, makeToken } from '@/test-utils/jwt'

const ACCESS_KEY = 'access_token'
const REFRESH_KEY = 'refresh_token'

/** A fresh store reads tokens from localStorage, as on page load. */
function createStore() {
  setActivePinia(createPinia())
  return useAuthStore()
}

beforeEach(() => {
  localStorage.clear()
})

afterEach(async () => {
  vi.useRealTimers()
  // Logout resets other stores through dynamic imports; let them finish inside the test.
  await vi.dynamicImportSettled()
})

describe('useAuthStore: token expiry', () => {
  test('is authenticated with a live access token', () => {
    localStorage.setItem(ACCESS_KEY, makeToken('access', 600))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))

    const auth = createStore()

    expect(auth.isAuthenticated).toBe(true)
    expect(auth.orgId).toBe('org-1')
    expect(auth.hotelId).toBe('hotel-1')
    expect(auth.userId).toBe('user-1')
  })

  test('is not authenticated when the access token has expired', () => {
    const access = makeToken('access', -60)
    localStorage.setItem(ACCESS_KEY, access)
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))

    const auth = createStore()

    expect(auth.isAuthenticated).toBe(false)
    // The store does not drop tokens by itself; the router guard decides.
    expect(auth.accessToken).toBe(access)
  })

  test('treats the expiry moment itself as expired', () => {
    vi.useFakeTimers({ now: new Date('2026-11-10T12:00:00Z') })
    const exp = Math.floor(Date.now() / 1000)
    localStorage.setItem(ACCESS_KEY, makeJwt({ token_use: 'access', exp }))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))

    expect(createStore().isAuthenticated).toBe(false)
  })

  test('treats an access token without exp as expired', () => {
    localStorage.setItem(ACCESS_KEY, makeJwt({ token_use: 'access' }))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))

    expect(createStore().isAuthenticated).toBe(false)
  })

  test('treats a malformed access token as unauthenticated', () => {
    localStorage.setItem(ACCESS_KEY, 'not-a-jwt')

    const auth = createStore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.user).toBeNull()
  })

  test('clears legacy tokens without token_use on load', () => {
    localStorage.setItem(ACCESS_KEY, makeToken('access', 600, { token_use: undefined }))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))

    const auth = createStore()

    expect(auth.isAuthenticated).toBe(false)
    expect(auth.accessToken).toBe('')
    expect(auth.refreshToken).toBe('')
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })
})

describe('useAuthStore: token storage', () => {
  test('setTokens stores both tokens', () => {
    const auth = createStore()
    const access = makeToken('access', 600)
    const refresh = makeToken('refresh', 3600)

    auth.setTokens(access, refresh)

    expect(auth.isAuthenticated).toBe(true)
    expect(localStorage.getItem(ACCESS_KEY)).toBe(access)
    expect(localStorage.getItem(REFRESH_KEY)).toBe(refresh)
  })

  test('setTokens without a refresh token removes the stored one', () => {
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))
    const auth = createStore()

    auth.setTokens(makeToken('access', 600), '')

    expect(auth.refreshToken).toBe('')
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  test('logout clears both tokens', () => {
    localStorage.setItem(ACCESS_KEY, makeToken('access', 600))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))
    const auth = createStore()

    auth.logout()

    expect(auth.isAuthenticated).toBe(false)
    expect(localStorage.getItem(ACCESS_KEY)).toBeNull()
    expect(localStorage.getItem(REFRESH_KEY)).toBeNull()
  })

  // F2: the next user in the same tab must not see the previous user's data.
  test('logout drops cached server data and the session settings', () => {
    localStorage.setItem(ACCESS_KEY, makeToken('access', 600))
    localStorage.setItem(REFRESH_KEY, makeToken('refresh', 3600))
    const auth = createStore()
    const queryCache = useQueryCache()
    queryCache.setQueryData(['property', 'hotel'], { id: 'hotel-1', name: 'City' })
    queryCache.setQueryData(['pricing', 'base-rates'], [{ room_type_id: 'rt-1' }])
    const settings = useSettingsStore()
    settings.applyAccount({
      permissions: { bookings: { view: 2 } },
      settings: { locale: null },
    } as AccountBundleResponse)

    auth.logout()

    expect(queryCache.getEntries()).toHaveLength(0)
    expect(settings.permissions).toBeNull()
    expect(settings.permissionsLoaded).toBe(false)
  })
})
