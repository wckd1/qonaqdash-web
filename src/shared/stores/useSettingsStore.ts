import { formatApiError } from '@/shared/i18n/apiError'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import * as authApi from '@/features/auth/api'
import type { Permissions } from '@/shared/types/permissions'
import { extractPermissionsBundle, parsePermissions } from '@/shared/lib/permissions'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveInitialLocale,
  hasPinnedLocale,
} from '@/shared/i18n/resolveLocale'

const PERMISSIONS_STORAGE_KEY = 'qonaqdash.account.permissions'

function readCachedPermissions(): Permissions | null {
  try {
    const raw = localStorage.getItem(PERMISSIONS_STORAGE_KEY)
    if (!raw) return null
    const parsed = parsePermissions(JSON.parse(raw))
    return Object.keys(parsed).length ? parsed : null
  } catch {
    return null
  }
}

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref(resolveInitialLocale())
  /** From last `GET /api/account` — for sidebar / profile. */
  const accountEmail = ref<string | null>(null)
  const profileFirstName = ref<string | null>(null)
  const profileLastName = ref<string | null>(null)
  const userSettings = ref<Record<string, unknown> | null>(null)
  const permissions = ref<Permissions | null>(readCachedPermissions())
  const permissionsLoaded = ref(permissions.value !== null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  function syncVueI18n(code) {
    i18n.global.locale.value = code
  }

  /**
   * @param {string} code
   * @param {{ persist?: boolean }} [opts] - persist=true writes LOCALE_STORAGE_KEY (language pin in settings UI).
   */
  function setLocale(code, { persist = false } = {}) {
    const normalized = normalizeLocale(code)
    if (!normalized || !SUPPORTED_LOCALES.includes(normalized)) return
    locale.value = normalized
    syncVueI18n(normalized)
    if (persist) {
      try {
        localStorage.setItem(LOCALE_STORAGE_KEY, normalized)
      } catch {
        // ignore
      }
    }
  }

  /** Re-run resolver (storage + device) and sync i18n — e.g. after login. */
  function initLocale() {
    const next = resolveInitialLocale()
    locale.value = next
    syncVueI18n(next)
  }

  /**
   * `GET /api/account` — updates `accountEmail`, `userSettings`, and optionally UI locale.
   *
   * **Locale merge rule:**
   * 1. Pinned device language (`hasPinnedLocale()`) → do not change `locale` from the server.
   * 2. Else if `settings.locale` is `en` or `ru` → `setLocale(code, { persist: false })`.
   * 3. Else leave `locale` as already set from boot.
   */
  async function fetchUserSettings() {
    loading.value = true
    error.value = null
    try {
      const data = await authApi.fetchAccount()
      accountEmail.value = data?.account?.email ?? null
      profileFirstName.value =
        typeof data?.profile?.first_name === 'string' ? data.profile.first_name : null
      profileLastName.value =
        typeof data?.profile?.last_name === 'string' ? data.profile.last_name : null
      const settings =
        data?.settings && typeof data.settings === 'object' ? { ...data.settings } : {}
      userSettings.value = Object.keys(settings).length ? settings : null
      const nextPermissions = extractPermissionsBundle(data)
      if (nextPermissions) {
        permissions.value = nextPermissions
        localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions))
      }
      permissionsLoaded.value = true
      if (!hasPinnedLocale()) {
        const loc = settings.locale
        if (loc === 'en' || loc === 'ru') {
          setLocale(loc, { persist: false })
        }
      }
      return data
    } catch (e: unknown) {
      const err = e as { response?: { data?: { error?: unknown } }; message?: string }
      error.value =
        formatApiError(err.response?.data?.error) || err.message || 'Failed to load account'
      throw e
    } finally {
      loading.value = false
    }
  }

  function resetState() {
    accountEmail.value = null
    profileFirstName.value = null
    profileLastName.value = null
    userSettings.value = null
    permissions.value = null
    permissionsLoaded.value = false
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY)
    loading.value = false
    error.value = null
    initLocale()
  }

  return {
    locale,
    accountEmail,
    profileFirstName,
    profileLastName,
    userSettings,
    permissions,
    permissionsLoaded,
    loading,
    error,
    setLocale,
    initLocale,
    fetchUserSettings,
    resetState,
  }
})
