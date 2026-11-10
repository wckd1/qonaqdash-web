import { i18n } from '@/i18n'

/**
 * Form definition `label` / title string: translate only when the key exists.
 * Literal backend-authored labels/titles should render as-is without vue-i18n missing-key warnings.
 */
export function resolveFormCatalogString(value: unknown): string {
  if (value == null || value === '') return ''
  const text = String(value)
  return i18n.global.te(text) ? i18n.global.t(text) : text
}
