/**
 * FormDSL condition evaluator: visibleWhen / hiddenWhen / enabledWhen / disabledWhen.
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
  if ('notEquals' in cond) {
    return value !== cond.notEquals
  }
  if ('in' in cond && Array.isArray(cond.in)) {
    return cond.in.includes(value)
  }
  if ('notIn' in cond && Array.isArray(cond.notIn)) {
    return !cond.notIn.includes(value)
  }

  return true
}

/**
 * Evaluate condition(s) — single or array (logical AND).
 * Returns `true` when all conditions pass.
 */
function evaluateConditions(conditions: FormConditionOrArray | undefined, data: Record<string, unknown>): boolean {
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
 * Priority: `hiddenWhen` overrides `visibleWhen`; `disabledWhen` overrides `enabledWhen`.
 */
export function evaluateNodeState(
  node: {
    visibleWhen?: FormConditionOrArray
    hiddenWhen?: FormConditionOrArray
    enabledWhen?: FormConditionOrArray
    disabledWhen?: FormConditionOrArray
    options?: { hidden?: boolean }
  } | undefined | null,
  data: Record<string, unknown>,
): NodeState {
  if (!node) return { hidden: false, disabled: false }

  if (node.options?.hidden) {
    return { hidden: true, disabled: false }
  }

  let hidden = false
  if (node.visibleWhen != null) {
    hidden = !evaluateConditions(node.visibleWhen, data)
  }
  if (node.hiddenWhen != null) {
    const shouldHide = evaluateConditions(node.hiddenWhen, data)
    if (shouldHide) hidden = true
  }

  let disabled = false
  if (node.enabledWhen != null) {
    disabled = !evaluateConditions(node.enabledWhen, data)
  }
  if (node.disabledWhen != null) {
    const shouldDisable = evaluateConditions(node.disabledWhen, data)
    if (shouldDisable) disabled = true
  }

  return { hidden, disabled }
}
