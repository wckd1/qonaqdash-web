import { eachDayOfInterval, format, parse, startOfDay } from 'date-fns'

export function parseLocalYmd(ymd: string): Date {
  return parse(ymd, 'yyyy-MM-dd', new Date())
}

export function formatLocalYmd(date: Date): string {
  return format(startOfDay(date), 'yyyy-MM-dd')
}

/**
 * Inclusive calendar-day range (local).
 */
export function listDaysInclusive(fromStart: Date, toStart: Date): Date[] {
  const start = startOfDay(fromStart)
  const end = startOfDay(toStart)
  if (end < start) return []
  return eachDayOfInterval({ start, end })
}
