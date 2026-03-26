import { formatApiError } from '@/shared/i18n/apiError'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import * as authApi from '@/features/auth/api'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveInitialLocale,
  hasPinnedLocale,
} from '@/shared/i18n/resolveLocale'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref(resolveInitialLocale())
  /** From last `GET /api/account` — for sidebar / profile. */
  const accountEmail = ref(null)
  const userSettings = ref(null)
  const loading = ref(false)
  const error = ref(null)

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
      const settings =
        data?.settings && typeof data.settings === 'object' ? { ...data.settings } : {}
      userSettings.value = Object.keys(settings).length ? settings : null
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

  return {
    locale,
    accountEmail,
    userSettings,
    loading,
    error,
    setLocale,
    initLocale,
    fetchUserSettings,
  }
})
