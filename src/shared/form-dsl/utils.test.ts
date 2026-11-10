import { describe, expect, test } from 'vitest'
import { formatDateTime } from '@/shared/form-dsl/utils'

// Local times without an offset, so the expectations do not depend on the time zone.
const MORNING = '2026-03-05T09:07:00'
const AFTERNOON = '2026-03-05T14:30:00'

describe('formatDateTime', () => {
  test('formats date and 24-hour time for the locale', () => {
    expect(formatDateTime(AFTERNOON, 'ru-RU')).toBe('05.03.2026 14:30')
    expect(formatDateTime(AFTERNOON, 'en-US')).toBe('03/05/2026 14:30')
    expect(formatDateTime(MORNING, 'en-US')).toBe('03/05/2026 09:07')
  })

  test('formats only the date when asked', () => {
    expect(formatDateTime(AFTERNOON, 'ru-RU', { type: 'date' })).toBe('05.03.2026')
    expect(formatDateTime(AFTERNOON, 'en-US', { type: 'date' })).toBe('03/05/2026')
  })

  test('uses the app locale when no locale is given', () => {
    // The app falls back to English in tests (no pinned locale, jsdom navigator is en-US).
    expect(formatDateTime(AFTERNOON)).toBe('03/05/2026 14:30')
  })

  test('returns unparseable strings unchanged', () => {
    expect(formatDateTime('not a date', 'en-US')).toBe('not a date')
  })

  test('returns an empty string for missing values', () => {
    expect(formatDateTime(null)).toBe('')
    expect(formatDateTime(undefined)).toBe('')
  })
})
