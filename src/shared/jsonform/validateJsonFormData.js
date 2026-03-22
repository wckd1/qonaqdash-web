/**
 * Client-side JSON Schema validation for JsonFormEdit payloads (AJV), mapped to JSONForms scopes for errorsMap.
 */

import Ajv from 'ajv'
import addFormats from 'ajv-formats'
import { pathToScope } from './utils'
import { localizeAjvError } from './ajvErrorI18n'

const ajv = new Ajv({ allErrors: true, strict: false })
addFormats(ajv)

/** @type {WeakMap<object, import('ajv').ValidateFunction>} */
const compileCache = new WeakMap()

/**
 * @param {Record<string, unknown>} schema
 * @returns {import('ajv').ValidateFunction | null}
 */
function getValidator(schema) {
  if (!schema || typeof schema !== 'object') return null
  let validate = compileCache.get(schema)
  if (validate) return validate
  try {
    validate = ajv.compile(schema)
  } catch {
    return null
  }
  compileCache.set(schema, validate)
  return validate
}

/**
 * Map an AJV error to a JSONForms `scope` key used by ControlRenderer.
 * @param {import('ajv').ErrorObject} err
 * @returns {string}
 */
function errorToScope(err) {
  let segments = (err.instancePath ?? '').split('/').filter(Boolean)
  if (err.keyword === 'required' && err.params && typeof err.params.missingProperty === 'string') {
    segments = [...segments, err.params.missingProperty]
  }
  if (!segments.length) return ''
  return pathToScope(segments)
}

/**
 * @param {Record<string, unknown>} schema - Root JSON Schema for the form
 * @param {Record<string, unknown>} data - Payload to validate (camelCase, same shape as form state)
 * @returns {{ valid: boolean, errorsMap: Record<string, string[]> }}
 */
export function validateJsonFormData(schema, data) {
  const validate = getValidator(schema)
  if (!validate) return { valid: true, errorsMap: {} }

  const payload = data && typeof data === 'object' ? data : {}
  const ok = validate(payload)
  if (ok) return { valid: true, errorsMap: {} }

  /** @type {Record<string, string[]>} */
  const errorsMap = {}
  for (const err of validate.errors ?? []) {
    const scope = errorToScope(err)
    const msg = localizeAjvError(err)
    if (!errorsMap[scope]) errorsMap[scope] = []
    if (!errorsMap[scope].includes(msg)) errorsMap[scope].push(msg)
  }
  return { valid: false, errorsMap }
}
