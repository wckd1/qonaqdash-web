import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveInitialLocale,
} from '@/shared/i18n/resolveLocale'

export const useSettingsStore = defineStore('settings', () => {
  const locale = ref(resolveInitialLocale())
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
   * Load user preferences from the API once `GET /api/me/settings` exists (see docs/backend-change-requests.md).
   * Assign non-locale fields from the response to `userSettings` always.
   *
   * **Locale merge rule** (implement only here; use `hasPinnedLocale()` from `@/shared/i18n/resolveLocale`):
   * 1. If the user pinned a language (`hasPinnedLocale()`), do **not** change `locale` from the server; UI stays on the pin.
   * 2. Else if the response includes a supported `locale` / `language` field → `setLocale(code, { persist: false })`.
   * 3. Else leave `locale` as already set from boot (`resolveInitialLocale()`).
   */
  async function fetchUserSettings() {
    return Promise.resolve(null)
  }

  return {
    locale,
    userSettings,
    loading,
    error,
    setLocale,
    initLocale,
    fetchUserSettings,
  }
})
