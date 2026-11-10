/**
 * Moments: points in time (check-in, check-out, the end of a repair, when a
 * record was made). The API sends them in RFC 3339 with an offset. They are
 * shown and entered as the wall time of a given IANA time zone, never the zone
 * of the browser: screens take the zone from `useHotelTime`.
 *
 * The conversions use `Intl.DateTimeFormat` with `timeZone` and handle the
 * daylight saving changes of the zone.
 */
import { isLocalDate, type LocalDate } from '@/shared/lib/localDate'

/** A moment as the API sends it (RFC 3339), a `Date` or epoch milliseconds. */
export type MomentInput = string | number | Date

/** Wall time in a time zone: the local date and `HH:mm` on the clock. */
export type WallTime = { date: LocalDate; time: string }

const DAY_MS = 86_400_000

function epochMs(moment: MomentInput): number {
  if (moment instanceof Date) return moment.getTime()
  if (typeof moment === 'number') return moment
  return moment ? new Date(moment).getTime() : Number.NaN
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

/** Milliseconds of the given fields read as UTC; years below 100 stay as they are. */
function utcMs(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute: number,
  second: number,
): number {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  date.setUTCHours(hour, minute, second, 0)
  return date.getTime()
}

type ClockFields = {
  year: number
  month: number
  day: number
  hour: number
  minute: number
  second: number
}

const clockFormatters = new Map<string, Intl.DateTimeFormat>()

function clockFormatter(timeZone: string): Intl.DateTimeFormat {
  let cached = clockFormatters.get(timeZone)
  if (!cached) {
    cached = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hourCycle: 'h23',
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
    })
    clockFormatters.set(timeZone, cached)
  }
  return cached
}

/** What the clock in `timeZone` shows at the moment. */
function clockAt(ms: number, timeZone: string): ClockFields {
  const fields: ClockFields = { year: 0, month: 0, day: 0, hour: 0, minute: 0, second: 0 }
  for (const part of clockFormatter(timeZone).formatToParts(ms)) {
    if (part.type in fields) fields[part.type as keyof ClockFields] = Number(part.value)
  }
  // Some engines write midnight as 24 even with h23.
  if (fields.hour === 24) fields.hour = 0
  return fields
}

/** Offset of `timeZone` from UTC at the moment, in milliseconds (+5 h for Asia/Tashkent). */
function offsetAt(ms: number, timeZone: string): number {
  const c = clockAt(ms, timeZone)
  const wholeSeconds = Math.floor(ms / 1000) * 1000
  return utcMs(c.year, c.month, c.day, c.hour, c.minute, c.second) - wholeSeconds
}

/** The time zone of the browser, for the hint with the employee's own time. */
export function browserTimeZone(): string {
  return new Intl.DateTimeFormat().resolvedOptions().timeZone
}

/** Wall time of the moment in `timeZone`; `null` for an invalid moment. */
export function wallTimeOf(moment: MomentInput, timeZone: string): WallTime | null {
  const ms = epochMs(moment)
  if (Number.isNaN(ms)) return null
  const c = clockAt(ms, timeZone)
  return {
    date: `${pad(c.year, 4)}-${pad(c.month)}-${pad(c.day)}`,
    time: `${pad(c.hour)}:${pad(c.minute)}`,
  }
}

/** The local date the moment falls on in `timeZone`; `''` for an invalid moment. */
export function localDateOf(moment: MomentInput, timeZone: string): LocalDate {
  return wallTimeOf(moment, timeZone)?.date ?? ''
}

const TIME = /^(\d{1,2}):(\d{2})(?::(\d{2}))?$/

/**
 * The moment when the clock in `timeZone` shows `date` and `time` (`HH:mm` or
 * `HH:mm:ss`); `null` when the date or the time is invalid.
 *
 * Daylight saving changes resolve as `Date` does for the zone of the browser
 * (Temporal's `compatible`): a time the clock skips moves forward by the
 * skipped hour, and a time the clock shows twice is the earlier moment.
 */
export function momentFromWallTime(date: LocalDate, time: string, timeZone: string): Date | null {
  const match = TIME.exec(time)
  if (!isLocalDate(date) || !match) return null
  const hour = Number(match[1])
  const minute = Number(match[2])
  const second = Number(match[3] ?? 0)
  if (hour > 23 || minute > 59 || second > 59) return null
  const [year, month, day] = date.split('-').map(Number)
  const wall = utcMs(year, month, day, hour, minute, second)

  // A zone changes its offset at most once within a day around the wall time.
  const offsetBefore = offsetAt(wall - DAY_MS, timeZone)
  const offsetAfter = offsetAt(wall + DAY_MS, timeZone)
  const candidates = [wall - offsetBefore, wall - offsetAfter].sort((a, b) => a - b)
  const matching = candidates.find((ms) => offsetAt(ms, timeZone) === wall - ms)
  // No match: the clock skips this time, so it reads with the offset before the change.
  return new Date(matching ?? wall - offsetBefore)
}

/** Date and time, short: `05.03.2026, 14:30`, `3/5/26, 2:30 PM`. */
export const SHORT_DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: 'short',
  timeStyle: 'short',
}

/** Date with the month name and time: `5 мар. 2026 г., 14:30`, `Mar 5, 2026, 2:30 PM`. */
export const MEDIUM_DATE_TIME: Intl.DateTimeFormatOptions = {
  dateStyle: 'medium',
  timeStyle: 'short',
}

/** Date with the month name: `5 мар. 2026 г.`, `Mar 5, 2026`. */
export const MEDIUM_DATE: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }

/** Date and time with seconds, all digits: `05.03.2026, 14:30:05`, `3/5/2026, 2:30:05 PM`. */
export const NUMERIC_DATE_TIME_SECONDS: Intl.DateTimeFormatOptions = {
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
}

const displayFormatters = new Map<string, Intl.DateTimeFormat>()

function displayFormatter(
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${timeZone}|${JSON.stringify(options)}`
  let cached = displayFormatters.get(key)
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...options, timeZone })
    displayFormatters.set(key, cached)
  }
  return cached
}

/**
 * Formats the moment as the clock in `timeZone` shows it, for the locale.
 * An empty value gives `''`; an invalid moment, locale or zone gives the input back.
 */
export function formatMoment(
  moment: MomentInput | null | undefined,
  locale: string,
  timeZone: string,
  options: Intl.DateTimeFormatOptions = SHORT_DATE_TIME,
): string {
  if (moment == null || moment === '') return ''
  const ms = epochMs(moment)
  if (Number.isNaN(ms)) return String(moment)
  try {
    return displayFormatter(locale, timeZone, options).format(ms)
  } catch {
    return String(moment)
  }
}
