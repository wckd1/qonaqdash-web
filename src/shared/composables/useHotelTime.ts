import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import type { LocalDate } from '@/shared/lib/localDate'
import {
  browserTimeZone,
  formatMoment as formatMomentIn,
  localDateOf as localDateIn,
  momentFromWallTime,
  wallTimeOf,
  type MomentInput,
  type WallTime,
} from '@/shared/lib/moment'

/**
 * Time of the hotel: moments are shown and entered as the clock of the hotel
 * shows them, and "today" is the local date of the hotel.
 *
 * The time zone below is the only place that decides which zone that is.
 */
export function useHotelTime() {
  const { locale } = useI18n()

  // The hotel does not carry its time zone yet, so the zone of the browser
  // keeps every screen as it was. Switch this to the time zone of the hotel.
  const timeZone = computed(() => browserTimeZone())

  /** The local date of the hotel now. */
  function today(): LocalDate {
    return localDateIn(new Date(), timeZone.value)
  }

  /** The local date of the hotel the moment falls on; `''` for an invalid moment. */
  function localDateOf(moment: MomentInput): LocalDate {
    return localDateIn(moment, timeZone.value)
  }

  /**
   * The moment as the hotel clock shows it, in the UI locale (`SHORT_DATE_TIME`
   * and the other presets of `@/shared/lib/moment`). An empty value gives `''`.
   */
  function formatMoment(
    moment: MomentInput | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return formatMomentIn(moment, locale.value, timeZone.value, options)
  }

  /** Date and `HH:mm` of the moment on the hotel clock, for input fields; `null` when invalid. */
  function toWallTime(moment: MomentInput): WallTime | null {
    return wallTimeOf(moment, timeZone.value)
  }

  /** The moment (RFC 3339) when the hotel clock shows `date` and `time`; `''` when invalid. */
  function fromWallTime(date: LocalDate, time: string): string {
    return momentFromWallTime(date, time, timeZone.value)?.toISOString() ?? ''
  }

  /** The value of a `datetime-local` input for the moment; `''` when invalid. */
  function toDateTimeInput(moment: MomentInput | null | undefined): string {
    if (moment == null || moment === '') return ''
    const wall = toWallTime(moment)
    return wall ? `${wall.date}T${wall.time}` : ''
  }

  /** The moment (RFC 3339) a `datetime-local` value means on the hotel clock; `''` when invalid. */
  function fromDateTimeInput(value: string): string {
    const [date, time] = value.split('T')
    return time === undefined ? '' : fromWallTime(date, time)
  }

  return {
    timeZone,
    today,
    localDateOf,
    formatMoment,
    toWallTime,
    fromWallTime,
    toDateTimeInput,
    fromDateTimeInput,
  }
}
