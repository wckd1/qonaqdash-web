/**
 * Local dates: calendar days written as `YYYY-MM-DD`, without a time and a
 * time zone (the nights of a stay, a report day, a column of the grid).
 *
 * The arithmetic counts calendar days, so a daylight saving change never
 * makes a day 23 or 25 hours long. Which local date a moment falls on depends
 * on a time zone: see `localDateOf` in `@/shared/lib/moment`.
 */

/** A calendar day `YYYY-MM-DD`. */
export type LocalDate = string

const LOCAL_DATE = /^(\d{4})-(\d{2})-(\d{2})$/
const DAY_MS = 86_400_000

/** Milliseconds of `year-month-day 00:00` UTC; years below 100 stay as they are. */
function utcMidnight(year: number, month: number, day: number): number {
  const date = new Date(0)
  date.setUTCFullYear(year, month - 1, day)
  return date.getTime()
}

/** Days since 1970-01-01 of a valid local date, `NaN` otherwise. */
function epochDay(date: string): number {
  const match = LOCAL_DATE.exec(date)
  if (!match) return Number.NaN
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const ms = utcMidnight(year, month, day)
  const check = new Date(ms)
  if (
    check.getUTCFullYear() !== year ||
    check.getUTCMonth() !== month - 1 ||
    check.getUTCDate() !== day
  ) {
    return Number.NaN
  }
  return ms / DAY_MS
}

function pad(value: number, length = 2): string {
  return String(value).padStart(length, '0')
}

function fromEpochDay(day: number): LocalDate {
  const date = new Date(day * DAY_MS)
  return `${pad(date.getUTCFullYear(), 4)}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`
}

/** `true` for an existing calendar day in the `YYYY-MM-DD` form (`2026-02-30` is not one). */
export function isLocalDate(value: unknown): value is LocalDate {
  return typeof value === 'string' && !Number.isNaN(epochDay(value))
}

/** The local date `days` later (earlier when negative); `''` for an invalid date. */
export function addDays(date: LocalDate, days: number): LocalDate {
  const day = epochDay(date)
  if (Number.isNaN(day) || !Number.isInteger(days)) return ''
  return fromEpochDay(day + days)
}

/** Calendar days from `from` to `to` (negative when `to` is earlier); `NaN` for an invalid date. */
export function daysBetween(from: LocalDate, to: LocalDate): number {
  return epochDay(to) - epochDay(from)
}

/** Every local date of the half-open period `[from, to)`. */
export function eachLocalDate(from: LocalDate, to: LocalDate): LocalDate[] {
  const start = epochDay(from)
  const end = epochDay(to)
  const dates: LocalDate[] = []
  for (let day = start; day < end; day++) dates.push(fromEpochDay(day))
  return dates
}

/** The first day of the month of `date`; `''` for an invalid date. */
export function startOfMonth(date: LocalDate): LocalDate {
  return isLocalDate(date) ? `${date.slice(0, 8)}01` : ''
}

/**
 * The same day `months` later (earlier when negative), moved back to the last
 * day of a shorter month (`2026-01-31` + 1 month is `2026-02-28`); `''` for an invalid date.
 */
export function addMonths(date: LocalDate, months: number): LocalDate {
  if (!isLocalDate(date) || !Number.isInteger(months)) return ''
  const [year, month, day] = date.split('-').map(Number)
  const index = year * 12 + (month - 1) + months
  const targetYear = Math.floor(index / 12)
  const targetMonth = index - targetYear * 12 + 1
  const lastDay = new Date(utcMidnight(targetYear, targetMonth + 1, 0)).getUTCDate()
  return `${pad(targetYear, 4)}-${pad(targetMonth)}-${pad(Math.min(day, lastDay))}`
}

/** Day, month and year as digits: `05.03.2026`, `03/05/2026`. */
export const NUMERIC_DATE: Intl.DateTimeFormatOptions = {
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
}

/** Weekday, day and month: `Thu, Mar 5`, `чт, 5 мар.`. */
export const WEEKDAY_DATE: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
}

const formatters = new Map<string, Intl.DateTimeFormat>()

function formatter(locale: string, options: Intl.DateTimeFormatOptions): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`
  let cached = formatters.get(key)
  if (!cached) {
    cached = new Intl.DateTimeFormat(locale, { ...options, timeZone: 'UTC' })
    formatters.set(key, cached)
  }
  return cached
}

/**
 * Formats a local date for the locale. The date is a calendar day, so no time
 * zone shifts it. An invalid date or locale gives the input back.
 */
export function formatLocalDate(
  date: LocalDate,
  locale: string,
  options: Intl.DateTimeFormatOptions = NUMERIC_DATE,
): string {
  const day = epochDay(date)
  if (Number.isNaN(day)) return date
  try {
    return formatter(locale, options).format(day * DAY_MS)
  } catch {
    return date
  }
}

/**
 * The parts of a formatted local date, for a layout that places them apart
 * (the day over the month in a grid column). An invalid date or locale gives no parts.
 */
export function formatLocalDateToParts(
  date: LocalDate,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormatPart[] {
  const day = epochDay(date)
  if (Number.isNaN(day)) return []
  try {
    return formatter(locale, options).formatToParts(day * DAY_MS)
  } catch {
    return []
  }
}
