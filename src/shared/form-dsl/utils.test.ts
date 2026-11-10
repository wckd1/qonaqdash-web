import { afterEach, describe, expect, test, vi } from 'vitest'
import { dateFieldValue, formatDateField } from '@/shared/form-dsl/utils'

const TASHKENT = 'Asia/Tashkent'
const LOS_ANGELES = 'America/Los_Angeles'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('formatDateField', () => {
  test('formats the calendar day for the locale', () => {
    expect(formatDateField('2026-03-05', TASHKENT, 'ru-RU')).toBe('05.03.2026')
    expect(formatDateField('2026-03-05', TASHKENT, 'en-US')).toBe('03/05/2026')
  })

  // A date field keeps a calendar day: it read as UTC midnight and showed the day before west of UTC.
  test('shows the calendar day of a date field in every zone', () => {
    vi.stubEnv('TZ', LOS_ANGELES)
    expect(formatDateField('2026-03-05', LOS_ANGELES, 'en-US')).toBe('03/05/2026')
    expect(formatDateField('2026-03-05', TASHKENT, 'en-US')).toBe('03/05/2026')
  })

  test('reads a moment in a date field as its date in the zone', () => {
    expect(formatDateField('2026-03-04T20:00:00Z', TASHKENT, 'en-US')).toBe('03/05/2026')
    expect(formatDateField('2026-03-04T20:00:00Z', LOS_ANGELES, 'en-US')).toBe('03/04/2026')
  })

  test('uses the app locale when no locale is given', () => {
    // The app falls back to English in tests (no pinned locale, jsdom navigator is en-US).
    expect(formatDateField('2026-03-05', TASHKENT)).toBe('03/05/2026')
  })

  test('returns unparseable strings unchanged and an empty string for missing values', () => {
    expect(formatDateField('not a date', TASHKENT, 'en-US')).toBe('not a date')
    expect(formatDateField(null, TASHKENT)).toBe('')
    expect(formatDateField(undefined, TASHKENT)).toBe('')
  })
})

describe('dateFieldValue', () => {
  test('keeps a calendar day as it is in every zone', () => {
    vi.stubEnv('TZ', LOS_ANGELES)
    expect(dateFieldValue('2026-03-05', LOS_ANGELES)).toBe('2026-03-05')
  })

  test('reads a moment as its local date in the zone', () => {
    expect(dateFieldValue('2026-03-04T20:00:00Z', TASHKENT)).toBe('2026-03-05')
    expect(dateFieldValue('2026-03-04T20:00:00Z', LOS_ANGELES)).toBe('2026-03-04')
  })

  test('gives an empty value for anything else', () => {
    expect(dateFieldValue('', TASHKENT)).toBe('')
    expect(dateFieldValue('soon', TASHKENT)).toBe('')
  })
})
