/**
 * `beforeinput` guards that prevent invalid characters from entering form fields.
 * Each guard validates the prospective value (current + incoming data) to decide
 * whether to block the input. No flicker, no cursor issues.
 */

import type { FormFieldRules, FormNodeType } from '@/shared/types/forms'

/** Guard for standalone number inputs outside FormDSL. */
export function guardNumberBeforeInput(e: InputEvent, rules?: FormFieldRules): void {
  if (!e.data) return
  guardNumberInput(e, rules)
}

export function guardBeforeInput(
  e: InputEvent,
  nodeType: FormNodeType,
  rules?: FormFieldRules,
): void {
  if (!e.data) return

  switch (nodeType) {
    case 'number':
      guardNumberInput(e, rules)
      break
    case 'phone':
      guardPhoneInput(e)
      break
  }
}

function guardNumberInput(e: InputEvent, rules?: FormFieldRules): void {
  const data = e.data!
  const minAllowsNegative = rules?.min == null || rules.min < 0

  for (const char of data) {
    if (/\d/.test(char)) continue
    if (char === '.') continue
    if (char === '-' && minAllowsNegative) continue
    e.preventDefault()
    return
  }
}

function guardPhoneInput(e: InputEvent): void {
  const input = e.target as HTMLInputElement
  const current = input.value
  const selStart = input.selectionStart ?? 0
  const selEnd = input.selectionEnd ?? selStart

  const prospective = current.slice(0, selStart) + e.data! + current.slice(selEnd)
  const stripped = prospective.replace(/[\s\-()/.]/g, '')

  if (!/^\+?\d*$/.test(stripped)) {
    e.preventDefault()
  }
}
