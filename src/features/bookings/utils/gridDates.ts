import { eachDayOfInterval, format, parse, startOfDay } from 'date-fns'

/** @param {string} ymd */
export function parseLocalYmd(ymd) {
  return parse(ymd, 'yyyy-MM-dd', new Date())
}

/** @param {Date} date */
export function formatLocalYmd(date) {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

/**
 * Inclusive calendar-day range (local).
 * @param {Date} fromStart
 * @param {Date} toStart
 * @returns {Date[]}
 */
export function listDaysInclusive(fromStart, toStart) {
  const start = startOfDay(fromStart)
  const end = startOfDay(toStart)
  if (end < start) return []
  return eachDayOfInterval({ start, end })
}
