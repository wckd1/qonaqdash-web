/**
 * Phone input formatting using libphonenumber-js.
 * Numbers starting with `+` are formatted internationally via `AsYouType`;
 * numbers without `+` are stored as-is (no country inference).
 */

import { AsYouType, formatIncompletePhoneNumber } from 'libphonenumber-js'

/** Extract raw digits with optional leading `+` from a formatted phone string. */
export function extractPhoneDigits(formatted: string): string {
  const hasPlus = formatted.startsWith('+')
  const digits = formatted.replace(/\D/g, '')
  return hasPlus ? `+${digits}` : digits
}

/** Format a raw phone value for an `<input>` during editing (progressive formatting). */
export function formatPhoneValue(raw: string): string {
  if (!raw) return ''
  if (!raw.startsWith('+')) return raw
  return new AsYouType().input(raw)
}

/** Format a raw phone value for read-only display. */
export function formatPhoneDisplay(raw: string): string {
  if (!raw || typeof raw !== 'string') return String(raw ?? '')
  if (!raw.startsWith('+')) return raw
  return formatIncompletePhoneNumber(raw)
}

/**
 * After reformatting a phone value, compute where the cursor should land.
 * We count how many real digits were before the cursor in the old value
 * and find the matching position in the new (formatted) string.
 */
export function computePhoneCursorPosition(
  formatted: string,
  digitsBefore: number,
  hadPlus: boolean,
): number {
  if (digitsBefore === 0) {
    return hadPlus && formatted.startsWith('+') ? 1 : 0
  }

  let count = 0
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i])) {
      count++
      if (count === digitsBefore) return i + 1
    }
  }
  return formatted.length
}
