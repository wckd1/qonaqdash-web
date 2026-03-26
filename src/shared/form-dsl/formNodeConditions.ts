/**
 * FormDSL condition evaluator: visible_when / hidden_when / enabled_when / disabled_when.
 */

import type { FormCondition, FormConditionOrArray } from '@/shared/types/forms'
import { getValueByBind } from './utils'

/**
 * Evaluate a single condition against the companion data object.
 */
function evaluateSingleCondition(cond: FormCondition, data: Record<string, unknown>): boolean {
  const value = getValueByBind(data, cond.bind)

  if ('exists' in cond && cond.exists === true) {
    return value !== null && value !== undefined
  }
  if ('equals' in cond) {
    return value === cond.equals
  }
  if ('not_equals' in cond) {
    return value !== cond.not_equals
  }
  if ('in' in cond && Array.isArray(cond.in)) {
    return cond.in.includes(value)
  }
  if ('not_in' in cond && Array.isArray(cond.not_in)) {
    return !cond.not_in.includes(value)
  }

  return true
}

/**
 * Evaluate condition(s) — single or array (logical AND).
 * Returns `true` when all conditions pass.
 */
function evaluateConditions(
  conditions: FormConditionOrArray | undefined,
  data: Record<string, unknown>,
): boolean {
  if (conditions == null) return true
  if (Array.isArray(conditions)) {
    return conditions.every((c) => evaluateSingleCondition(c, data))
  }
  return evaluateSingleCondition(conditions, data)
}

export interface NodeState {
  hidden: boolean
  disabled: boolean
}

/**
 * Evaluate visibility and interactivity state for a FormDSL node.
 *
 * Priority: `hidden_when` overrides `visible_when`; `disabled_when` overrides `enabled_when`.
 */
export function evaluateNodeState(
  node:
    | {
        visible_when?: FormConditionOrArray
        hidden_when?: FormConditionOrArray
        enabled_when?: FormConditionOrArray
        disabled_when?: FormConditionOrArray
        options?: { hidden?: boolean }
      }
    | undefined
    | null,
  data: Record<string, unknown>,
): NodeState {
  if (!node) return { hidden: false, disabled: false }

  if (node.options?.hidden) {
    return { hidden: true, disabled: false }
  }

  let hidden = false
  if (node.visible_when != null) {
    hidden = !evaluateConditions(node.visible_when, data)
  }
  if (node.hidden_when != null) {
    const shouldHide = evaluateConditions(node.hidden_when, data)
    if (shouldHide) hidden = true
  }

  let disabled = false
  if (node.enabled_when != null) {
    disabled = !evaluateConditions(node.enabled_when, data)
  }
  if (node.disabled_when != null) {
    const shouldDisable = evaluateConditions(node.disabled_when, data)
    if (shouldDisable) disabled = true
  }

  return { hidden, disabled }
}
