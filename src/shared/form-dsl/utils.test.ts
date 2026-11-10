import { afterEach, describe, expect, test, vi } from 'vitest'
import { dateFieldValue, formatDateTime } from '@/shared/form-dsl/utils'

const TASHKENT = 'Asia/Tashkent'
const LOS_ANGELES = 'America/Los_Angeles'

// 14:30 and 09:07 on the clock of Tashkent (+05:00).
const MORNING = '2026-03-05T04:07:00Z'
const AFTERNOON = '2026-03-05T09:30:00Z'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('formatDateTime', () => {
  test('formats date and 24-hour time for the locale on the clock of the zone', () => {
    expect(formatDateTime(AFTERNOON, TASHKENT, { locale: 'ru-RU' })).toBe('05.03.2026 14:30')
    expect(formatDateTime(AFTERNOON, TASHKENT, { locale: 'en-US' })).toBe('03/05/2026 14:30')
    expect(formatDateTime(MORNING, TASHKENT, { locale: 'en-US' })).toBe('03/05/2026 09:07')
    expect(formatDateTime(AFTERNOON, LOS_ANGELES, { locale: 'en-US' })).toBe('03/05/2026 01:30')
  })

  test('takes the date of the zone around midnight', () => {
    expect(formatDateTime('2026-03-04T20:00:00Z', TASHKENT, { locale: 'en-US' })).toBe(
      '03/05/2026 01:00',
    )
  })

  test('does not depend on the zone of the runtime', () => {
    vi.stubEnv('TZ', LOS_ANGELES)
    expect(formatDateTime(AFTERNOON, TASHKENT, { locale: 'ru-RU' })).toBe('05.03.2026 14:30')
  })

  test('formats only the date when asked', () => {
    expect(formatDateTime(AFTERNOON, TASHKENT, { type: 'date', locale: 'ru-RU' })).toBe(
      '05.03.2026',
    )
    expect(formatDateTime(AFTERNOON, TASHKENT, { type: 'date', locale: 'en-US' })).toBe(
      '03/05/2026',
    )
  })

  // A date field keeps a calendar day: it read as UTC midnight and showed the day before west of UTC.
  test('shows the calendar day of a date field in every zone', () => {
    vi.stubEnv('TZ', LOS_ANGELES)
    expect(formatDateTime('2026-03-05', LOS_ANGELES, { type: 'date', locale: 'en-US' })).toBe(
      '03/05/2026',
    )
    expect(formatDateTime('2026-03-05', TASHKENT, { type: 'date', locale: 'en-US' })).toBe(
      '03/05/2026',
    )
  })

  test('uses the app locale when no locale is given', () => {
    // The app falls back to English in tests (no pinned locale, jsdom navigator is en-US).
    expect(formatDateTime(AFTERNOON, TASHKENT)).toBe('03/05/2026 14:30')
  })

  test('returns unparseable strings unchanged', () => {
    expect(formatDateTime('not a date', TASHKENT, { locale: 'en-US' })).toBe('not a date')
    expect(formatDateTime('not a date', TASHKENT, { type: 'date', locale: 'en-US' })).toBe(
      'not a date',
    )
  })

  test('returns an empty string for missing values', () => {
    expect(formatDateTime(null, TASHKENT)).toBe('')
    expect(formatDateTime(undefined, TASHKENT)).toBe('')
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
