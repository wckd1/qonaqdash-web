import { describe, expect, test } from 'vitest'
import {
  formatLocalYmd,
  listDaysInclusive,
  parseLocalYmd,
} from '@/features/bookings/utils/gridDates'

describe('parseLocalYmd', () => {
  test('parses YYYY-MM-DD as local midnight', () => {
    const date = parseLocalYmd('2026-03-05')

    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(2)
    expect(date.getDate()).toBe(5)
    expect(date.getHours()).toBe(0)
    expect(date.getMinutes()).toBe(0)
  })

  test('returns an invalid date for malformed input', () => {
    expect(Number.isNaN(parseLocalYmd('05.03.2026').getTime())).toBe(true)
  })
})

describe('formatLocalYmd', () => {
  test('formats the local calendar day, ignoring the time', () => {
    expect(formatLocalYmd(new Date(2026, 2, 5, 23, 59))).toBe('2026-03-05')
    expect(formatLocalYmd(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01')
  })

  test('round-trips with parseLocalYmd', () => {
    expect(formatLocalYmd(parseLocalYmd('2026-12-31'))).toBe('2026-12-31')
  })
})

describe('listDaysInclusive', () => {
  test('includes both ends', () => {
    const days = listDaysInclusive(new Date(2026, 2, 5, 15), new Date(2026, 2, 7, 9))

    expect(days.map(formatLocalYmd)).toEqual(['2026-03-05', '2026-03-06', '2026-03-07'])
  })

  test('crosses month and year boundaries', () => {
    const days = listDaysInclusive(new Date(2026, 11, 30), new Date(2027, 0, 2))

    expect(days.map(formatLocalYmd)).toEqual([
      '2026-12-30',
      '2026-12-31',
      '2027-01-01',
      '2027-01-02',
    ])
  })

  test('returns a single day for the same date', () => {
    expect(listDaysInclusive(new Date(2026, 2, 5), new Date(2026, 2, 5))).toHaveLength(1)
  })

  test('returns nothing when the range is reversed', () => {
    expect(listDaysInclusive(new Date(2026, 2, 7), new Date(2026, 2, 5))).toEqual([])
  })
})
