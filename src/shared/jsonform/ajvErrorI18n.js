/**
 * Map AJV validation errors to vue-i18n strings (jsonForm.validation.*).
 */

import { i18n } from '@/i18n'

/**
 * Human-readable type label(s) for schema `type` keyword errors.
 * @param {unknown} typeParam - from err.params.type
 * @returns {string}
 */
function formatTypeLabel(typeParam) {
  const t = i18n.global.t
  const te = i18n.global.te
  const raw = Array.isArray(typeParam) ? typeParam : typeParam != null ? [typeParam] : []
  const parts = raw.map((typ) => {
    const s = String(typ)
    const key = `jsonForm.build.schemaType.${s === 'integer' ? 'integer' : s}`
    return te(key) ? t(key) : s
  })
  return parts.length ? parts.join(' / ') : t('jsonForm.build.schemaType.string')
}

/**
 * @param {import('ajv').ErrorObject} err
 * @returns {string}
 */
export function localizeAjvError(err) {
  const t = i18n.global.t
  const te = i18n.global.te
  const keyword = err.keyword
  const p = err.params && typeof err.params === 'object' ? err.params : {}

  switch (keyword) {
    case 'required':
    case 'dependentRequired':
      return t('jsonForm.validation.required')
    case 'type':
      return t('jsonForm.validation.type', { type: formatTypeLabel(p.type) })
    case 'minLength':
      return t('jsonForm.validation.minLength', { min: p.limit })
    case 'maxLength':
      return t('jsonForm.validation.maxLength', { max: p.limit })
    case 'minItems':
      return t('jsonForm.validation.minItems', { min: p.limit })
    case 'maxItems':
      return t('jsonForm.validation.maxItems', { max: p.limit })
    case 'minimum':
      return t('jsonForm.validation.minimumInclusive', { limit: p.limit })
    case 'maximum':
      return t('jsonForm.validation.maximumInclusive', { limit: p.limit })
    case 'exclusiveMinimum':
      return t('jsonForm.validation.minimumExclusive', { limit: p.limit })
    case 'exclusiveMaximum':
      return t('jsonForm.validation.maximumExclusive', { limit: p.limit })
    case 'multipleOf':
      return t('jsonForm.validation.multipleOf', { step: p.multipleOf })
    case 'format': {
      const fmt = String(p.format ?? '').replace(/-/g, '_')
      const key = `jsonForm.validation.format_${fmt}`
      return te(key) ? t(key) : t('jsonForm.validation.invalidFormat')
    }
    case 'pattern':
      return t('jsonForm.validation.pattern')
    case 'enum':
      return t('jsonForm.validation.enum')
    case 'const':
      return t('jsonForm.validation.const')
    case 'additionalProperties':
      return t('jsonForm.validation.additionalProperties')
    case 'oneOf':
      return t('jsonForm.validation.oneOf')
    case 'anyOf':
      return t('jsonForm.validation.anyOf')
    case 'allOf':
      return t('jsonForm.validation.allOf')
    case 'not':
      return t('jsonForm.validation.not')
    case 'minProperties':
      return t('jsonForm.validation.minProperties', { min: p.limit })
    case 'maxProperties':
      return t('jsonForm.validation.maxProperties', { max: p.limit })
    default:
      return t('jsonForm.validation.generic')
  }
}
