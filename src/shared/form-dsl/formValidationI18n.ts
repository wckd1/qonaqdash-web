/**
 * Map FormDSL validation rule keywords to vue-i18n strings (formDsl.validation.*).
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
      return t('formDsl.validation.required')
    case 'minLength':
      return t('formDsl.validation.minLength', { min: p.min })
    case 'maxLength':
      return t('formDsl.validation.maxLength', { max: p.max })
    case 'min':
      return t('formDsl.validation.minimumInclusive', { limit: p.limit })
    case 'max':
      return t('formDsl.validation.maximumInclusive', { limit: p.limit })
    case 'minItems':
      return t('formDsl.validation.minItems', { min: p.min })
    case 'maxItems':
      return t('formDsl.validation.maxItems', { max: p.max })
    default:
      return t('formDsl.validation.generic')
  }
}
