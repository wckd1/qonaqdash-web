import { describe, expect, test } from 'vitest'
import {
  formatMoney,
  formatMoneyPlain,
  getCurrencyExponent,
  getCurrencySymbol,
  isCredit,
  isDebit,
  majorToMinor,
  minorToMajor,
} from '@/shared/lib/money'

/** Intl uses no-break spaces for grouping in some locales. */
function normalizeSpaces(value: string): string {
  return value.replace(/\s/g, ' ')
}

describe('getCurrencyExponent', () => {
  test.each([
    ['KZT', 2],
    ['USD', 2],
    ['JPY', 0],
    ['KWD', 3],
    ['jpy', 0],
    ['XYZ', 2],
  ])('%s has exponent %i', (code, exponent) => {
    expect(getCurrencyExponent(code)).toBe(exponent)
  })
})

describe('minor and major units', () => {
  test('minorToMajor divides by the currency exponent', () => {
    expect(minorToMajor(10000, 'KZT')).toBe(100)
    expect(minorToMajor(1500, 'JPY')).toBe(1500)
    expect(minorToMajor(12345, 'KWD')).toBe(12.345)
  })

  test('majorToMinor multiplies by the currency exponent and rounds', () => {
    expect(majorToMinor(100, 'KZT')).toBe(10000)
    expect(majorToMinor(19.99, 'USD')).toBe(1999)
    expect(majorToMinor(12.345, 'KWD')).toBe(12345)
    expect(majorToMinor(1500.4, 'JPY')).toBe(1500)
    expect(majorToMinor(1500.5, 'JPY')).toBe(1501)
  })

  // WP0-F3: `Math.round(x * 100)` saw 1.005 as 100.49999999999999.
  test.each([
    [1.005, 'USD', 101],
    [0.285, 'USD', 29],
    [1.115, 'KZT', 112],
    [8.345, 'EUR', 835],
    [1.0005, 'KWD', 1001],
    [0.5, 'JPY', 1],
    [0.004, 'USD', 0],
    [1234567.895, 'USD', 123456790],
  ])('majorToMinor rounds %d %s half-up to %i', (major, code, minor) => {
    expect(majorToMinor(major, code)).toBe(minor)
  })

  test('majorToMinor rounds a negative half away from zero, as the backend does', () => {
    expect(majorToMinor(-1.005, 'USD')).toBe(-101)
    expect(majorToMinor(-0.5, 'JPY')).toBe(-1)
    expect(majorToMinor(-19.99, 'USD')).toBe(-1999)
  })

  test('majorToMinor handles amounts printed in exponent notation', () => {
    expect(majorToMinor(1e-7, 'USD')).toBe(0)
    expect(majorToMinor(5e-3, 'USD')).toBe(1)
    expect(majorToMinor(1e21, 'JPY')).toBe(1e21)
  })

  test('majorToMinor keeps zero and rejects what is not a number', () => {
    expect(majorToMinor(0, 'USD')).toBe(0)
    expect(Object.is(majorToMinor(-0, 'USD'), 0)).toBe(true)
    expect(majorToMinor(Number.NaN, 'USD')).toBeNaN()
    expect(majorToMinor(Number.POSITIVE_INFINITY, 'USD')).toBeNaN()
  })

  test('round trip keeps the amount', () => {
    for (const amount of [0, 1, 99, 123456, 1999999]) {
      expect(majorToMinor(minorToMajor(amount, 'KZT'), 'KZT')).toBe(amount)
    }
  })
})

describe('formatMoney', () => {
  test('formats minor units as currency for the locale', () => {
    expect(formatMoney(123456, 'USD', 'en')).toBe('$1,234.56')
    expect(formatMoney(1500, 'JPY', 'en')).toBe('¥1,500')
    expect(formatMoney(-2500, 'USD', 'en')).toBe('-$25.00')
  })

  test('uses the locale separators', () => {
    expect(normalizeSpaces(formatMoney(123456789, 'KZT', 'ru'))).toMatch(/^1 234 567,89 /)
  })

  test('defaults to English', () => {
    expect(formatMoney(100, 'USD')).toBe('$1.00')
  })

  test('falls back to amount and code for a currency Intl rejects', () => {
    expect(formatMoney(1234, 'ABCD', 'en')).toBe('12.34 ABCD')
  })
})

describe('formatMoneyPlain', () => {
  test('formats without the currency symbol, with the currency precision', () => {
    expect(formatMoneyPlain(123456, 'USD', 'en')).toBe('1,234.56')
    expect(formatMoneyPlain(1500, 'JPY', 'en')).toBe('1,500')
    expect(formatMoneyPlain(12345, 'KWD', 'en')).toBe('12.345')
    expect(normalizeSpaces(formatMoneyPlain(123450, 'KZT', 'ru'))).toBe('1 234,50')
  })
})

describe('balance direction', () => {
  test('positive delta is a debit, negative is a credit, zero is neither', () => {
    expect(isDebit(100)).toBe(true)
    expect(isCredit(100)).toBe(false)
    expect(isDebit(-100)).toBe(false)
    expect(isCredit(-100)).toBe(true)
    expect(isDebit(0)).toBe(false)
    expect(isCredit(0)).toBe(false)
  })
})

describe('getCurrencySymbol', () => {
  test('returns the symbol for supported currencies and the code otherwise', () => {
    expect(getCurrencySymbol('KZT')).toBe('₸')
    expect(getCurrencySymbol('usd')).toBe('$')
    expect(getCurrencySymbol('GBP')).toBe('GBP')
  })
})
