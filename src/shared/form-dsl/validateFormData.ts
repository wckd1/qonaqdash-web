/**
 * Client-side validation for FormDSL forms.
 * Walks the definition tree, reads `validation` on input nodes, checks the companion data.
 */

import type { FormNode, FormValidation } from '@/shared/types/forms'
import { INPUT_NODE_TYPES } from '@/shared/types/forms'
import { bindToPath, getValueByPath } from './utils'
import { localizeValidationError } from './formValidationI18n'

/**
 * Validate form data against a FormDSL definition tree.
 * Returns `{ valid, errorsMap }` where keys in errorsMap are bind paths.
 */
export function validateFormData(
  definition: FormNode | undefined | null,
  data: Record<string, unknown>,
): { valid: boolean; errorsMap: Record<string, string[]> } {
  const errorsMap: Record<string, string[]> = {}
  if (!definition) return { valid: true, errorsMap }

  walkNode(definition, data, '', errorsMap)

  return { valid: Object.keys(errorsMap).length === 0, errorsMap }
}

function addError(errorsMap: Record<string, string[]>, bind: string, msg: string): void {
  if (!errorsMap[bind]) errorsMap[bind] = []
  if (!errorsMap[bind].includes(msg)) errorsMap[bind].push(msg)
}

function walkNode(
  node: FormNode,
  data: Record<string, unknown>,
  bindPrefix: string,
  errorsMap: Record<string, string[]>,
): void {
  if (node.type === 'stack') {
    for (const child of node.items ?? []) {
      walkNode(child, data, bindPrefix, errorsMap)
    }
    return
  }

  if (node.type === 'group') {
    for (const child of node.items ?? []) {
      walkNode(child, data, bindPrefix, errorsMap)
    }
    return
  }

  if (node.type === 'array') {
    const fullBind = bindPrefix ? `${bindPrefix}.${node.bind}` : node.bind
    const path = bindToPath(fullBind)
    const value = getValueByPath(data, path)
    const arr = Array.isArray(value) ? value : []

    if (node.minItems != null && arr.length < node.minItems) {
      addError(errorsMap, fullBind, localizeValidationError('minItems', { min: node.minItems }))
    }
    if (node.maxItems != null && arr.length > node.maxItems) {
      addError(errorsMap, fullBind, localizeValidationError('maxItems', { max: node.maxItems }))
    }

    const itemNode = node.item
    if (itemNode) {
      for (let i = 0; i < arr.length; i++) {
        walkNode(itemNode, data, `${fullBind}.${i}`, errorsMap)
      }
    }
    return
  }

  if (node.type === 'button') return

  if (INPUT_NODE_TYPES.has(node.type) && 'bind' in node) {
    const inputNode = node as { bind: string; validation?: FormValidation }
    const fullBind = bindPrefix ? `${bindPrefix}.${inputNode.bind}` : inputNode.bind
    const path = bindToPath(fullBind)
    const value = getValueByPath(data, path)
    validateField(fullBind, value, inputNode.validation, errorsMap)
  }
}

function validateField(
  bind: string,
  value: unknown,
  validation: FormValidation | undefined,
  errorsMap: Record<string, string[]>,
): void {
  if (!validation) return

  const isEmpty = value == null || value === '' || (typeof value === 'string' && value.trim() === '')

  if (validation.required && isEmpty) {
    addError(errorsMap, bind, localizeValidationError('required'))
    return
  }

  if (isEmpty) return

  if (typeof value === 'string') {
    if (validation.minLength != null && value.length < validation.minLength) {
      addError(errorsMap, bind, localizeValidationError('minLength', { min: validation.minLength }))
    }
    if (validation.maxLength != null && value.length > validation.maxLength) {
      addError(errorsMap, bind, localizeValidationError('maxLength', { max: validation.maxLength }))
    }
  }

  if (typeof value === 'number') {
    if (validation.min != null && value < validation.min) {
      addError(errorsMap, bind, localizeValidationError('min', { limit: validation.min }))
    }
    if (validation.max != null && value > validation.max) {
      addError(errorsMap, bind, localizeValidationError('max', { limit: validation.max }))
    }
  }
}
