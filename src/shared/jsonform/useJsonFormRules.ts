/**
 * JSON Forms–style visibility / enablement rules (uischema `rule` + Ajv on scoped value).
 */

import Ajv from 'ajv'
import { scopeToPath, getValueByPath } from './utils'

const ajv = new Ajv({ allErrors: true, strict: false })

/**
 * @param {Record<string, unknown>} element - UISchema node (Group, Control, layout)
 * @param {Record<string, unknown>} model - Root form model (full `data`), not a nested slice
 * @returns {{ hidden: boolean, disabled: boolean }}
 */
export function evaluateRule(element, model) {
  let hidden = false
  let disabled = false

  const rule = element?.rule
  const scope = rule?.condition?.scope
  const condSchema = rule?.condition?.schema

  if (!scope || condSchema == null || typeof condSchema !== 'object') {
    return { hidden, disabled }
  }

  const path = scopeToPath(scope)
  let value = getValueByPath(model ?? {}, path)
  if (value === undefined) value = null

  let validate
  try {
    validate = ajv.compile(condSchema)
  } catch {
    return { hidden, disabled }
  }

  const matches = validate(value)

  switch (rule.effect) {
    case 'HIDE':
      hidden = matches
      break
    case 'SHOW':
      hidden = !matches
      break
    case 'DISABLE':
      disabled = matches
      break
    case 'ENABLE':
      disabled = !matches
      break
    default:
      break
  }

  return { hidden, disabled }
}
