import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  formatMoment,
  localDateOf,
  MEDIUM_DATE,
  momentFromWallTime,
  sameClock,
  timeZoneLabel,
  SHORT_DATE_TIME,
  wallTimeOf,
} from '@/shared/lib/moment'
import { addDays, daysBetween } from '@/shared/lib/localDate'

const BERLIN = 'Europe/Berlin'
const TASHKENT = 'Asia/Tashkent'
const NEW_YORK = 'America/New_York'

/** Intl puts a narrow no-break space before AM/PM in some ICU versions. */
function spaces(value: string): string {
  return value.replace(/\s/g, ' ')
}

/** RFC 3339 in UTC of the moment for the clock in the zone. */
function utc(date: string, time: string, zone: string): string | undefined {
  return momentFromWallTime(date, time, zone)?.toISOString()
}

afterEach(() => {
  vi.unstubAllEnvs()
})

describe('wallTimeOf', () => {
  test('reads the clock of the zone, not of the runtime', () => {
    const moment = '2026-03-05T09:30:00Z'

    expect(wallTimeOf(moment, TASHKENT)).toEqual({ date: '2026-03-05', time: '14:30' })
    expect(wallTimeOf(moment, BERLIN)).toEqual({ date: '2026-03-05', time: '10:30' })
    expect(wallTimeOf(moment, NEW_YORK)).toEqual({ date: '2026-03-05', time: '04:30' })
    expect(wallTimeOf(moment, 'UTC')).toEqual({ date: '2026-03-05', time: '09:30' })
  })

  test('reads a moment with any offset and as a Date or milliseconds', () => {
    expect(wallTimeOf('2026-03-05T14:30:00+05:00', BERLIN)).toEqual({
      date: '2026-03-05',
      time: '10:30',
    })
    expect(wallTimeOf(new Date('2026-03-05T09:30:00Z'), TASHKENT)?.time).toBe('14:30')
    expect(wallTimeOf(Date.UTC(2026, 2, 5, 9, 30), TASHKENT)?.time).toBe('14:30')
  })

  test('writes midnight as 00:00', () => {
    expect(wallTimeOf('2026-03-04T19:00:00Z', TASHKENT)).toEqual({
      date: '2026-03-05',
      time: '00:00',
    })
  })

  test('gives null for an invalid moment', () => {
    expect(wallTimeOf('not a date', BERLIN)).toBeNull()
    expect(wallTimeOf('', BERLIN)).toBeNull()
    expect(wallTimeOf(Number.NaN, BERLIN)).toBeNull()
  })
})

describe('localDateOf', () => {
  test('takes the date of the zone around midnight', () => {
    // 23:30 UTC is already the next day in Berlin and still the same day in New York.
    expect(localDateOf('2026-03-04T23:30:00Z', BERLIN)).toBe('2026-03-05')
    expect(localDateOf('2026-03-05T03:30:00Z', NEW_YORK)).toBe('2026-03-04')
    expect(localDateOf('2026-03-04T19:00:00Z', TASHKENT)).toBe('2026-03-05')
    expect(localDateOf('2026-03-04T18:59:59Z', TASHKENT)).toBe('2026-03-04')
    expect(localDateOf('x', TASHKENT)).toBe('')
  })
})

describe('momentFromWallTime', () => {
  test('turns the clock of the zone into a moment', () => {
    expect(utc('2026-03-05', '14:30', TASHKENT)).toBe('2026-03-05T09:30:00.000Z')
    expect(utc('2026-03-05', '00:00', TASHKENT)).toBe('2026-03-04T19:00:00.000Z')
    expect(utc('2026-07-05', '14:00', BERLIN)).toBe('2026-07-05T12:00:00.000Z')
    expect(utc('2026-01-05', '14:00', BERLIN)).toBe('2026-01-05T13:00:00.000Z')
    expect(utc('2026-07-05', '14:00', NEW_YORK)).toBe('2026-07-05T18:00:00.000Z')
    expect(utc('2026-03-05', '14:30:15', 'UTC')).toBe('2026-03-05T14:30:15.000Z')
  })

  test('accepts an hour without the leading zero, as the hotel hours may come', () => {
    expect(utc('2026-03-05', '9:00', TASHKENT)).toBe('2026-03-05T04:00:00.000Z')
  })

  test.each([
    ['2026-02-30', '14:00'],
    ['2026-3-5', '14:00'],
    ['2026-03-05', '24:00'],
    ['2026-03-05', '14:60'],
    ['2026-03-05', '14'],
    ['2026-03-05', ''],
  ])('gives null for %s %s', (date, time) => {
    expect(momentFromWallTime(date, time, BERLIN)).toBeNull()
  })

  describe('Europe/Berlin, spring: 2026-03-29 02:00 CET becomes 03:00 CEST', () => {
    test('times around the change keep their offsets', () => {
      expect(utc('2026-03-29', '01:59', BERLIN)).toBe('2026-03-29T00:59:00.000Z')
      expect(utc('2026-03-29', '03:00', BERLIN)).toBe('2026-03-29T01:00:00.000Z')
      expect(utc('2026-03-29', '14:00', BERLIN)).toBe('2026-03-29T12:00:00.000Z')
      expect(utc('2026-03-28', '14:00', BERLIN)).toBe('2026-03-28T13:00:00.000Z')
    })

    test('a time the clock skips moves forward by the skipped hour', () => {
      expect(utc('2026-03-29', '02:00', BERLIN)).toBe('2026-03-29T01:00:00.000Z')
      expect(utc('2026-03-29', '02:30', BERLIN)).toBe('2026-03-29T01:30:00.000Z')
      expect(wallTimeOf('2026-03-29T01:30:00.000Z', BERLIN)?.time).toBe('03:30')
    })
  })

  describe('Europe/Berlin, autumn: 2026-10-25 03:00 CEST becomes 02:00 CET', () => {
    test('times around the change keep their offsets', () => {
      expect(utc('2026-10-25', '01:59', BERLIN)).toBe('2026-10-24T23:59:00.000Z')
      expect(utc('2026-10-25', '03:00', BERLIN)).toBe('2026-10-25T02:00:00.000Z')
      expect(utc('2026-10-25', '12:00', BERLIN)).toBe('2026-10-25T11:00:00.000Z')
      expect(utc('2026-10-24', '12:00', BERLIN)).toBe('2026-10-24T10:00:00.000Z')
    })

    test('a time the clock shows twice is the earlier moment', () => {
      expect(utc('2026-10-25', '02:30', BERLIN)).toBe('2026-10-25T00:30:00.000Z')
      // Both moments read 02:30 on the clock.
      expect(wallTimeOf('2026-10-25T00:30:00Z', BERLIN)?.time).toBe('02:30')
      expect(wallTimeOf('2026-10-25T01:30:00Z', BERLIN)?.time).toBe('02:30')
    })
  })

  test('round-trips every quarter of an hour over both Berlin changes', () => {
    for (const date of ['2026-03-29', '2026-10-25']) {
      for (let minutes = 0; minutes < 24 * 60; minutes += 15) {
        const time = `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`
        const skipped = date === '2026-03-29' && time >= '02:00' && time < '03:00'
        const moment = momentFromWallTime(date, time, BERLIN)
        expect(moment).not.toBeNull()
        if (!skipped) expect(wallTimeOf(moment!, BERLIN)).toEqual({ date, time })
      }
    }
  })

  test('matches Date for the zone of the runtime, so the browser zone keeps the old behaviour', () => {
    vi.stubEnv('TZ', BERLIN)
    for (const [date, time] of [
      ['2026-03-29', '01:30'],
      ['2026-03-29', '02:30'],
      ['2026-03-29', '03:30'],
      ['2026-10-25', '02:30'],
      ['2026-10-25', '03:30'],
      ['2026-06-01', '14:00'],
    ]) {
      expect(utc(date, time, BERLIN)).toBe(new Date(`${date}T${time}`).toISOString())
    }
  })

  test('does not depend on the zone of the runtime', () => {
    const expected = utc('2026-10-25', '02:30', BERLIN)
    for (const zone of ['UTC', 'America/Los_Angeles', 'Asia/Tashkent', 'Australia/Lord_Howe']) {
      vi.stubEnv('TZ', zone)
      expect(utc('2026-10-25', '02:30', BERLIN)).toBe(expected)
      expect(wallTimeOf('2026-03-29T01:30:00Z', BERLIN)).toEqual({
        date: '2026-03-29',
        time: '03:30',
      })
    }
  })
})

describe('nights over a clock change', () => {
  // Check-in 14:00 on Saturday, check-out 12:00 on Monday: two nights,
  // although Berlin is only 45 hours long between them in spring and 47 in autumn.
  test.each([
    ['2026-03-28', '2026-03-30'],
    ['2026-10-24', '2026-10-26'],
  ])('a stay from %s to %s in Berlin has two nights', (from, to) => {
    const checkIn = momentFromWallTime(from, '14:00', BERLIN)!
    const checkOut = momentFromWallTime(to, '12:00', BERLIN)!

    expect(daysBetween(localDateOf(checkIn, BERLIN), localDateOf(checkOut, BERLIN))).toBe(2)
    expect(localDateOf(momentFromWallTime(addDays(from, 1), '14:00', BERLIN)!, BERLIN)).toBe(
      addDays(from, 1),
    )
  })
})

describe('formatMoment', () => {
  const moment = '2026-03-05T09:30:05Z'

  test('formats the clock of the zone for the locale', () => {
    expect(formatMoment(moment, 'ru-RU', TASHKENT)).toBe('05.03.2026, 14:30')
    expect(spaces(formatMoment(moment, 'en-US', TASHKENT))).toBe('3/5/26, 2:30 PM')
    expect(spaces(formatMoment(moment, 'en-US', NEW_YORK, SHORT_DATE_TIME))).toBe('3/5/26, 4:30 AM')
  })

  test('formats with the presets', () => {
    expect(formatMoment(moment, 'en-US', TASHKENT, MEDIUM_DATE)).toBe('Mar 5, 2026')
    expect(formatMoment(moment, 'ru-RU', TASHKENT, MEDIUM_DATE)).toBe('5 мар. 2026 г.')
  })

  test('takes the date of the zone', () => {
    expect(formatMoment('2026-03-04T23:30:00Z', 'en-US', BERLIN, MEDIUM_DATE)).toBe('Mar 5, 2026')
    expect(formatMoment('2026-03-04T23:30:00Z', 'en-US', NEW_YORK, MEDIUM_DATE)).toBe('Mar 4, 2026')
  })

  test('does not depend on the zone of the runtime', () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')
    expect(formatMoment(moment, 'ru-RU', TASHKENT)).toBe('05.03.2026, 14:30')
  })

  test('gives an empty string for no value and the input for an invalid one', () => {
    expect(formatMoment(null, 'en', BERLIN)).toBe('')
    expect(formatMoment(undefined, 'en', BERLIN)).toBe('')
    expect(formatMoment('', 'en', BERLIN)).toBe('')
    expect(formatMoment('soon', 'en', BERLIN)).toBe('soon')
    expect(formatMoment(moment, 'not a locale!', BERLIN)).toBe(moment)
  })
})

describe('zones side by side', () => {
  test('sameClock compares what the clocks show at the moment', () => {
    expect(sameClock('2026-03-05T09:30:00Z', TASHKENT, 'Asia/Karachi')).toBe(true)
    expect(sameClock('2026-03-05T09:30:00Z', TASHKENT, BERLIN)).toBe(false)
    // London and Lisbon agree all year; Berlin and London never do.
    expect(sameClock('2026-07-01T12:00:00Z', 'Europe/London', 'Europe/Lisbon')).toBe(true)
    expect(sameClock('2026-07-01T12:00:00Z', BERLIN, 'Europe/London')).toBe(false)
    expect(sameClock('x', TASHKENT, BERLIN)).toBe(true)
  })

  test('timeZoneLabel gives the offset of the zone at the moment', () => {
    expect(timeZoneLabel('2026-03-05T09:30:00Z', TASHKENT, 'en')).toBe('GMT+5')
    expect(timeZoneLabel('2026-03-05T09:30:00Z', TASHKENT, 'ru')).toBe('GMT+5')
    expect(timeZoneLabel('2026-01-15T12:00:00Z', BERLIN, 'en')).toBe('GMT+1')
    expect(timeZoneLabel('2026-07-15T12:00:00Z', BERLIN, 'en')).toBe('GMT+2')
    expect(timeZoneLabel('2026-07-15T12:00:00Z', NEW_YORK, 'en')).toBe('GMT-4')
    expect(timeZoneLabel('2026-07-15T12:00:00Z', 'UTC', 'en')).toBe('GMT')
    expect(timeZoneLabel('x', TASHKENT, 'en')).toBe('')
  })
})
