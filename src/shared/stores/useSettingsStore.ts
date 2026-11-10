import { defineStore } from 'pinia'
import { ref } from 'vue'
import { i18n } from '@/i18n'
import type { Schemas } from '@/shared/api/typed'
import type { Permissions } from '@/shared/types/permissions'
import { extractPermissionsBundle, parsePermissions } from '@/shared/lib/permissions'
import {
  LOCALE_STORAGE_KEY,
  SUPPORTED_LOCALES,
  normalizeLocale,
  resolveInitialLocale,
  hasPinnedLocale,
  type AppLocale,
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
  /**
   * Effective permissions of the signed-in user, from the last `GET /api/account`.
   * Kept in localStorage so route guards can decide before the account loads.
   */
  const permissions = ref<Permissions | null>(readCachedPermissions())
  const permissionsLoaded = ref(permissions.value !== null)

  function syncVueI18n(code: AppLocale) {
    i18n.global.locale.value = code
  }

  /**
   * @param opts.persist - true writes LOCALE_STORAGE_KEY (language pin in settings UI).
   */
  function setLocale(code: string | null | undefined, { persist = false } = {}) {
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
   * Applies the session parts of a loaded account (the account query calls it
   * on every load): the permission snapshot and, optionally, the UI locale.
   *
   * **Locale merge rule** (skipped when the user has pinned a language via settings UI):
   * 1. Server returns a supported locale → apply it.
   * 2. Server returns `null` or an unsupported value → fall back to `navigator` languages.
   * 3. Navigator reports no supported language → fall back to English.
   */
  function applyAccount(data: Schemas['iamhttp.AccountBundleResponse']) {
    const nextPermissions = extractPermissionsBundle(data)
    if (nextPermissions) {
      permissions.value = nextPermissions
      localStorage.setItem(PERMISSIONS_STORAGE_KEY, JSON.stringify(nextPermissions))
    }
    permissionsLoaded.value = true
    if (!hasPinnedLocale()) {
      const serverLocale = data?.settings?.locale
      const fromServer = normalizeLocale(typeof serverLocale === 'string' ? serverLocale : null)
      setLocale(fromServer ?? resolveInitialLocale(), { persist: false })
    }
  }

  function resetState() {
    permissions.value = null
    permissionsLoaded.value = false
    localStorage.removeItem(PERMISSIONS_STORAGE_KEY)
    initLocale()
  }

  return {
    locale,
    permissions,
    permissionsLoaded,
    setLocale,
    initLocale,
    applyAccount,
    resetState,
  }
})
