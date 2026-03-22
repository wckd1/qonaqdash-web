import { i18n } from '@/i18n'

/**
 * Schema / uischema title or label: pass through vue-i18n `t()`.
 * Known keys translate; missing keys fall back to the string itself (vue-i18n default).
 * @param {unknown} value
 * @returns {string}
 */
export function resolveFormCatalogString(value) {
  if (value == null || value === '') return ''
  return i18n.global.t(String(value))
}
