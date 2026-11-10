import { computed, inject, provide, watch, type InjectionKey } from 'vue'
import { useI18n } from 'vue-i18n'
import { useQuery } from '@pinia/colada'
import { hotelQuery } from '@/features/property/queries'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import type { LocalDate } from '@/shared/lib/localDate'
import {
  browserTimeZone,
  formatMoment as formatMomentIn,
  localDateOf as localDateIn,
  momentFromWallTime,
  sameClock,
  SHORT_DATE_TIME,
  timeZoneLabel,
  wallTimeOf,
  type MomentInput,
  type WallTime,
} from '@/shared/lib/moment'

export type HotelTime = ReturnType<typeof createHotelTime>

const hotelTimeKey: InjectionKey<HotelTime> = Symbol('hotelTime')

/**
 * Time of the hotel: moments are shown and entered as the clock of the hotel
 * shows them, and "today" is the local date of the hotel.
 *
 * The zone is `timezone` of `GET /api/property/hotel`. Until the hotel loads
 * (or when it cannot be loaded, or nobody is signed in) it is the zone of the browser; `ready` tells
 * when the hotel zone is known, and `whenReady()` waits for it, so a screen
 * that takes "today" once does it after the hotel has loaded.
 */
function createHotelTime() {
  const { locale } = useI18n()
  const authStore = useAuthStore()
  const signedIn = computed(() => !!authStore.hotelId)
  const hotel = useQuery(() => ({ ...hotelQuery, enabled: signedIn.value }))

  const timeZone = computed(() => hotel.data.value?.timezone || browserTimeZone())
  /** The hotel has loaded, or failed to: `timeZone` will not change by itself any more. */
  const ready = computed(() => !signedIn.value || hotel.status.value !== 'pending')

  function whenReady(): Promise<void> {
    if (ready.value) return Promise.resolve()
    return new Promise((resolve) => {
      const stop = watch(ready, (isReady) => {
        if (!isReady) return
        stop()
        resolve()
      })
    })
  }

  /** The local date of the hotel now. */
  function today(): LocalDate {
    return localDateIn(new Date(), timeZone.value)
  }

  /** The local date of the hotel the moment falls on; `''` for an invalid moment. */
  function localDateOf(moment: MomentInput): LocalDate {
    return localDateIn(moment, timeZone.value)
  }

  /** The moment as the hotel clock shows it, in the UI locale. An empty value gives `''`. */
  function formatMoment(
    moment: MomentInput | null | undefined,
    options?: Intl.DateTimeFormatOptions,
  ): string {
    return formatMomentIn(moment, locale.value, timeZone.value, options)
  }

  /**
   * Label of the hotel zone (`GMT+5`) when the clock of the browser shows
   * another time at the moment (now when there is none); `''` when both clocks agree.
   */
  function zoneLabel(moment?: MomentInput | null): string {
    const at = moment == null || moment === '' ? Date.now() : moment
    if (sameClock(at, timeZone.value, browserTimeZone())) return ''
    return timeZoneLabel(at, timeZone.value, locale.value)
  }

  /**
   * The moment on the employee's own clock with its zone (`10.11.2026, 12:45 GMT+1`)
   * when it differs from the hotel clock; `''` when both clocks agree or the moment is invalid.
   */
  function employeeTime(moment: MomentInput | null | undefined): string {
    if (moment == null || moment === '') return ''
    const own = browserTimeZone()
    if (sameClock(moment, timeZone.value, own)) return ''
    const text = formatMomentIn(moment, locale.value, own, SHORT_DATE_TIME)
    const label = timeZoneLabel(moment, own, locale.value)
    return label ? `${text} ${label}` : text
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
    ready,
    whenReady,
    today,
    localDateOf,
    formatMoment,
    zoneLabel,
    employeeTime,
    toWallTime,
    fromWallTime,
    toDateTimeInput,
    fromDateTimeInput,
  }
}

/**
 * Provides one hotel time to the component tree below. The app shell does it,
 * so the rows of a long table do not each subscribe to the hotel query.
 */
export function provideHotelTime(): HotelTime {
  const hotelTime = createHotelTime()
  provide(hotelTimeKey, hotelTime)
  return hotelTime
}

/** Hotel time of the app shell, or an own one outside it (tests, pages outside the shell). */
export function useHotelTime(): HotelTime {
  return inject(hotelTimeKey, null) ?? createHotelTime()
}
