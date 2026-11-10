import {
  addDays,
  addMonths,
  daysBetween,
  halfOpenPeriod,
  isLocalDate,
  startOfMonth,
  type LocalDate,
} from '@/shared/lib/localDate'

export type ReportPresetId =
  'this_month' | 'last_month' | 'last_7' | 'last_30' | 'last_90' | 'custom'

/** A report period as the toolbar shows it: both days included. */
export interface ReportDays {
  from: LocalDate
  to: LocalDate
}

/** Days of a preset counted back from `today` of the hotel, both ends included. */
export function presetDays(preset: ReportPresetId, today: LocalDate): ReportDays {
  const monthStart = startOfMonth(today)
  switch (preset) {
    case 'this_month':
      return { from: monthStart, to: addDays(addMonths(monthStart, 1), -1) }
    case 'last_month':
      return { from: addMonths(monthStart, -1), to: addDays(monthStart, -1) }
    case 'last_7':
      return { from: addDays(today, -6), to: today }
    case 'last_30':
      return { from: addDays(today, -29), to: today }
    case 'last_90':
      return { from: addDays(today, -89), to: today }
    default:
      return { from: today, to: today }
  }
}

/** Both ends are dates and the period has at least one day. */
export function isValidReportDays(days: ReportDays): boolean {
  return isLocalDate(days.from) && isLocalDate(days.to) && days.from <= days.to
}

/** Number of days of the period, both ends included. */
export function reportDayCount(days: ReportDays): number {
  return daysBetween(days.from, days.to) + 1
}

/** The period moved by `count` days of the same length, back when `direction` is -1. */
export function shiftReportDays(days: ReportDays, count: number, direction: 1 | -1): ReportDays {
  const from = addDays(days.from, count * direction)
  return { from, to: addDays(from, count - 1) }
}

/**
 * The API period of the days shown: `[from, to)`, so "1–31 March" asks for
 * `from=2026-03-01&to=2026-04-01`. F7: the inclusive `to` of the toolbar was sent as is.
 */
export function reportApiPeriod(days: ReportDays): { from: LocalDate; to: LocalDate } {
  return halfOpenPeriod(days.from, days.to)
}
