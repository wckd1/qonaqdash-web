/**
 * Map FormDSL validation rule keywords to vue-i18n strings (form_dsl.validation.*).
 */

import { i18n } from '@/i18n'

/**
 * Localize a validation error by keyword and params.
 */
export function localizeValidationError(keyword: string, params?: Record<string, unknown>): string {
  const t = i18n.global.t
  const p = params ?? {}

  switch (keyword) {
    case 'required':
      return t('form_dsl.validation.required')
    case 'min_length':
      return t('form_dsl.validation.min_length', { min: p.min })
    case 'max_length':
      return t('form_dsl.validation.max_length', { max: p.max })
    case 'min':
      return t('form_dsl.validation.minimum_inclusive', { limit: p.limit })
    case 'max':
      return t('form_dsl.validation.maximum_inclusive', { limit: p.limit })
    case 'min_items':
      return t('form_dsl.validation.min_items', { min: p.min })
    case 'max_items':
      return t('form_dsl.validation.max_items', { max: p.max })
    default:
      return t('form_dsl.validation.generic')
  }
}
