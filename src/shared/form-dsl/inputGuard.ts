/**
 * `beforeinput` guards that prevent invalid characters from entering form fields.
 * Each guard validates the prospective value (current + incoming data) to decide
 * whether to block the input. No flicker, no cursor issues.
 */

import type { FormNodeType, FormValidation } from '@/shared/types/forms'

/** Guard for standalone number inputs outside FormDSL. */
export function guardNumberBeforeInput(e: InputEvent, validation?: FormValidation): void {
  if (!e.data) return
  guardNumberInput(e, validation)
}

export function guardBeforeInput(
  e: InputEvent,
  nodeType: FormNodeType,
  validation?: FormValidation,
): void {
  if (!e.data) return

  switch (nodeType) {
    case 'number':
      guardNumberInput(e, validation)
      break
    case 'phone':
      guardPhoneInput(e)
      break
  }
}

function guardNumberInput(e: InputEvent, validation?: FormValidation): void {
  const data = e.data!
  const minAllowsNegative = validation?.min == null || validation.min < 0

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
