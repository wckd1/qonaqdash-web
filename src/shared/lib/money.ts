/**
 * Money formatting and conversion utilities.
 *
 * All monetary values in the API are **minor units** (integer cents/tiyn).
 * The ISO 4217 exponent for each currency code determines the divisor.
 * This module is the single source of truth for that conversion.
 */

const ZERO_DECIMAL = new Set([
  'BIF',
  'CLP',
  'DJF',
  'GNF',
  'ISK',
  'JPY',
  'KMF',
  'KRW',
  'MGA',
  'PYG',
  'RWF',
  'UGX',
  'VND',
  'VUV',
  'XAF',
  'XOF',
  'XPF',
])

const THREE_DECIMAL = new Set(['BHD', 'IQD', 'JOD', 'KWD', 'LYD', 'OMR', 'TND'])

/** ISO 4217 minor-unit exponent for the given currency code. Defaults to 2. */
export function getCurrencyExponent(currencyCode: string): number {
  const code = currencyCode.toUpperCase()
  if (ZERO_DECIMAL.has(code)) return 0
  if (THREE_DECIMAL.has(code)) return 3
  return 2
}

/** Convert an amount in **minor units** to **major units** (e.g. 10000 KZT → 100.00). */
export function minorToMajor(amountMinor: number, currencyCode: string): number {
  return amountMinor / 10 ** getCurrencyExponent(currencyCode)
}

/**
 * Convert an amount in **major units** to **minor units** with ROUND_HALF_UP
 * (a half goes away from zero, as on the backend).
 *
 * The decimal point is moved in the decimal digits of the amount, not by a
 * floating-point multiplication: `1.005 * 100` is `100.49999999999999`, while
 * the amount the user typed is `1.005`, which rounds to `101`.
 * A non-finite amount gives `NaN`.
 */
export function majorToMinor(amountMajor: number, currencyCode: string): number {
  return shiftDecimalHalfUp(amountMajor, getCurrencyExponent(currencyCode))
}

/** `value × 10^places` rounded half away from zero, computed on the shortest decimal form of `value`. */
function shiftDecimalHalfUp(value: number, places: number): number {
  if (!Number.isFinite(value)) return Number.NaN
  if (value === 0) return 0
  // Shortest round-trip digits: "1.005e+0", "2.85e-1", "1e+21".
  const [mantissa, exponent] = Math.abs(value).toExponential().split('e')
  const digits = mantissa.replace('.', '')
  // Count of digits before the decimal point after the shift.
  const point = 1 + Number(exponent) + places
  let whole: number
  let firstDropped: number
  if (point <= 0) {
    whole = 0
    firstDropped = point === 0 ? Number(digits[0]) : 0
  } else if (point >= digits.length) {
    whole = Number(digits.padEnd(point, '0'))
    firstDropped = 0
  } else {
    whole = Number(digits.slice(0, point))
    firstDropped = Number(digits[point])
  }
  const rounded = firstDropped >= 5 ? whole + 1 : whole
  return value < 0 && rounded !== 0 ? -rounded : rounded
}

/**
 * Format a minor-unit amount as a locale-aware currency string.
 *
 * Uses `Intl.NumberFormat` with `style: 'currency'` so the symbol,
 * grouping separator, and decimal placement follow the user's locale.
 *
 * @param amountMinor - Integer amount in minor currency units.
 * @param currencyCode - ISO 4217 alpha-3 (e.g. `KZT`).
 * @param locale - BCP 47 locale tag; falls back to `'en'`.
 */
export function formatMoney(
  amountMinor: number,
  currencyCode: string,
  locale: string = 'en',
): string {
  const exp = getCurrencyExponent(currencyCode)
  const major = amountMinor / 10 ** exp
  try {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: currencyCode,
    }).format(major)
  } catch {
    return `${major.toFixed(exp)} ${currencyCode}`
  }
}

/**
 * Format without the currency symbol — plain number with grouping.
 * Useful for inputs where the symbol is shown separately.
 */
export function formatMoneyPlain(
  amountMinor: number,
  currencyCode: string,
  locale: string = 'en',
): string {
  const exp = getCurrencyExponent(currencyCode)
  const major = amountMinor / 10 ** exp
  try {
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: exp,
      maximumFractionDigits: exp,
    }).format(major)
  } catch {
    return major.toFixed(exp)
  }
}

/** `true` when `balance_delta > 0` — guest owes more (charge / surcharge / refund-reversal). */
export function isDebit(balanceDelta: number): boolean {
  return balanceDelta > 0
}

/** `true` when `balance_delta < 0` — balance reduced (payment / discount / credit). */
export function isCredit(balanceDelta: number): boolean {
  return balanceDelta < 0
}

/** Currency codes available in the hotel settings dropdown. */
export const CURRENCY_CODES = ['KZT', 'USD', 'EUR'] as const

export type SupportedCurrencyCode = (typeof CURRENCY_CODES)[number]

const CURRENCY_SYMBOLS: Record<string, string> = {
  KZT: '₸',
  USD: '$',
  EUR: '€',
}

/** Resolve a display symbol for a currency code (falls back to the code itself). */
export function getCurrencySymbol(code: string): string {
  return CURRENCY_SYMBOLS[code.toUpperCase()] ?? code
}
