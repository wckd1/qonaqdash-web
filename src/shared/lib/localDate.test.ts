import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  addDays,
  addMonths,
  daysBetween,
  eachLocalDate,
  formatLocalDate,
  formatLocalDateToParts,
  isLocalDate,
  NUMERIC_DATE,
  startOfMonth,
  WEEKDAY_DATE,
} from '@/shared/lib/localDate'

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('isLocalDate', () => {
  test.each(['2026-03-05', '2024-02-29', '2026-12-31', '0099-01-01'])('accepts %s', (value) => {
    expect(isLocalDate(value)).toBe(true)
  })

  test.each([
    '2026-02-29',
    '2026-02-30',
    '2026-13-01',
    '2026-00-10',
    '2026-3-5',
    '05.03.2026',
    '2026-03-05T00:00:00Z',
    '',
    20260305,
    null,
  ])('rejects %s', (value) => {
    expect(isLocalDate(value)).toBe(false)
  })
})

describe('day arithmetic', () => {
  test('addDays crosses months, years and leap days', () => {
    expect(addDays('2026-03-05', 1)).toBe('2026-03-06')
    expect(addDays('2026-03-01', -1)).toBe('2026-02-28')
    expect(addDays('2024-02-28', 1)).toBe('2024-02-29')
    expect(addDays('2026-12-31', 1)).toBe('2027-01-01')
    expect(addDays('2026-03-05', 0)).toBe('2026-03-05')
    expect(addDays('2026-03-05', 365)).toBe('2027-03-05')
  })

  test('addDays gives an empty date for an invalid date or count', () => {
    expect(addDays('2026-02-30', 1)).toBe('')
    expect(addDays('', 1)).toBe('')
    expect(addDays('2026-03-05', 1.5)).toBe('')
    expect(addDays('2026-03-05', Number.NaN)).toBe('')
  })

  test('daysBetween counts calendar days', () => {
    expect(daysBetween('2026-03-05', '2026-03-07')).toBe(2)
    expect(daysBetween('2026-03-07', '2026-03-05')).toBe(-2)
    expect(daysBetween('2026-03-05', '2026-03-05')).toBe(0)
    expect(daysBetween('2026-12-30', '2027-01-02')).toBe(3)
    expect(daysBetween('2026-03-05', 'x')).toBeNaN()
  })

  // A stay over the spring and autumn clock changes in Europe has as many nights as dates.
  test('daysBetween is not shortened by daylight saving in the runtime zone', () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    expect(new Date(2026, 2, 30).getTimezoneOffset()).not.toBe(
      new Date(2026, 2, 28).getTimezoneOffset(),
    )

    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2)
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2)
    expect(addDays('2026-03-28', 1)).toBe('2026-03-29')
    expect(addDays('2026-10-25', 1)).toBe('2026-10-26')
  })

  test('eachLocalDate lists the half-open period', () => {
    expect(eachLocalDate('2026-12-30', '2027-01-02')).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
    ])
    expect(eachLocalDate('2026-03-05', '2026-03-05')).toEqual([])
    expect(eachLocalDate('2026-03-07', '2026-03-05')).toEqual([])
    expect(eachLocalDate('2026-03-05', 'x')).toEqual([])
  })
})

describe('month arithmetic', () => {
  test('startOfMonth gives the first day of the month', () => {
    expect(startOfMonth('2026-03-05')).toBe('2026-03-01')
    expect(startOfMonth('2026-03-01')).toBe('2026-03-01')
    expect(startOfMonth('2026-02-30')).toBe('')
  })

  test('addMonths keeps the day or moves it to the end of a shorter month', () => {
    expect(addMonths('2026-03-01', 1)).toBe('2026-04-01')
    expect(addMonths('2026-01-01', -1)).toBe('2025-12-01')
    expect(addMonths('2026-12-15', 1)).toBe('2027-01-15')
    expect(addMonths('2026-01-31', 1)).toBe('2026-02-28')
    expect(addMonths('2024-01-31', 1)).toBe('2024-02-29')
    expect(addMonths('2026-03-31', -1)).toBe('2026-02-28')
    expect(addMonths('2026-03-05', 0)).toBe('2026-03-05')
    expect(addMonths('2026-03-05', -27)).toBe('2023-12-05')
    expect(addMonths('x', 1)).toBe('')
  })
})

describe('formatLocalDate', () => {
  test('formats digits by default', () => {
    expect(formatLocalDate('2026-03-05', 'ru-RU')).toBe('05.03.2026')
    expect(formatLocalDate('2026-03-05', 'en-US', NUMERIC_DATE)).toBe('03/05/2026')
  })

  test('formats with the given options', () => {
    expect(formatLocalDate('2026-03-05', 'en', WEEKDAY_DATE)).toBe('Thu, Mar 5')
    expect(formatLocalDate('2026-03-01', 'ru', { month: 'long', year: 'numeric' })).toBe(
      'март 2026 г.',
    )
  })

  // A calendar day is the same day in every zone: no shift west of UTC.
  test.each(['America/Los_Angeles', 'Pacific/Kiritimati', 'Asia/Tashkent'])(
    'shows the same day with the runtime zone %s',
    (zone) => {
      vi.stubEnv('TZ', zone)
      expect(formatLocalDate('2026-03-05', 'en-US')).toBe('03/05/2026')
    },
  )

  test('gives the input back for an invalid date or locale', () => {
    expect(formatLocalDate('2026-02-30', 'en')).toBe('2026-02-30')
    expect(formatLocalDate('2026-03-05', 'not a locale!')).toBe('2026-03-05')
  })

  test('formatLocalDateToParts gives the month as it reads after a day', () => {
    const month = (locale: string, date: string) =>
      formatLocalDateToParts(date, locale, { day: 'numeric', month: 'short' }).find(
        (p) => p.type === 'month',
      )?.value

    expect(month('en', '2026-05-05')).toBe('May')
    expect(month('ru', '2026-05-05')).toBe('мая')
    expect(formatLocalDateToParts('x', 'en', { day: 'numeric' })).toEqual([])
  })
})
