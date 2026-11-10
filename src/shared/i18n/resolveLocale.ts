export type AppLocale = 'en' | 'ru'

export const LOCALE_STORAGE_KEY = 'qd_locale'

export const SUPPORTED_LOCALES: AppLocale[] = ['en', 'ru']

/**
 * Map BCP 47 / navigator tags to a supported app locale, or null.
 */
export function normalizeLocale(tag: string | null | undefined): AppLocale | null {
  if (tag == null || typeof tag !== 'string') return null
  let base = tag.split('-')[0].toLowerCase()
  try {
    const canonical = Intl.getCanonicalLocales(tag)[0]
    if (canonical) base = canonical.split('-')[0].toLowerCase()
  } catch {
    // ignore invalid tag
  }
  if (base === 'ru') return 'ru'
  if (base === 'en') return 'en'
  return null
}

/**
 * Pinned storage → first supported navigator language → English.
 */
export function resolveInitialLocale(): AppLocale {
  try {
    const pinned = localStorage.getItem(LOCALE_STORAGE_KEY)
    const n = normalizeLocale(pinned)
    if (n && SUPPORTED_LOCALES.includes(n)) return n
  } catch {
    // private mode / blocked storage
  }
  const candidates =
    typeof navigator !== 'undefined'
      ? [...(navigator.languages || []), navigator.language].filter(Boolean)
      : []
  for (const raw of candidates) {
    const n = normalizeLocale(raw)
    if (n) return n
  }
  return 'en'
}

/**
 * True when the user has pinned a language via `qd_locale` (see settings UI / setLocale persist).
 * Used when merging server user settings so a pin overrides server default locale.
 */
export function hasPinnedLocale(): boolean {
  try {
    const pinned = localStorage.getItem(LOCALE_STORAGE_KEY)
    const n = normalizeLocale(pinned)
    return !!(n && SUPPORTED_LOCALES.includes(n))
  } catch {
    return false
  }
}

/**
 * Tag for Intl.DateTimeFormat etc.
 */
export function intlLocaleFromAppLocale(code: AppLocale): string {
  return code === 'ru' ? 'ru-RU' : 'en-US'
}
