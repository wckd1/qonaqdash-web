import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { mountWithApp } from '@/test-utils/mount'
import { i18n } from '@/i18n'
import { useHotelTime } from '@/shared/composables/useHotelTime'
import { MEDIUM_DATE } from '@/shared/lib/moment'

function setupHotelTime() {
  let api: ReturnType<typeof useHotelTime> | undefined
  const Probe = defineComponent({
    setup() {
      api = useHotelTime()
      return () => null
    },
  })
  const wrapper = mountWithApp(Probe)
  return { api: api!, wrapper }
}

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
})

describe('useHotelTime', () => {
  // Until the hotel carries its time zone, the browser zone keeps every screen as before.
  test('takes the zone of the browser until the hotel has one', () => {
    vi.stubEnv('TZ', 'Asia/Tashkent')
    const { api, wrapper } = setupHotelTime()

    expect(api.timeZone.value).toBe('Asia/Tashkent')
    wrapper.unmount()
  })

  test('today is the local date of the hotel', () => {
    vi.stubEnv('TZ', 'Asia/Tashkent')
    vi.useFakeTimers({ toFake: ['Date'] })
    // 20:30 UTC is already the next day in Tashkent (+05:00).
    vi.setSystemTime(new Date('2026-03-04T20:30:00Z'))
    const { api, wrapper } = setupHotelTime()

    expect(api.today()).toBe('2026-03-05')
    expect(api.localDateOf('2026-03-04T18:59:00Z')).toBe('2026-03-04')
    wrapper.unmount()
  })

  test('converts the hotel clock of an input to a moment and back', () => {
    vi.stubEnv('TZ', 'Asia/Tashkent')
    const { api, wrapper } = setupHotelTime()

    expect(api.fromDateTimeInput('2026-03-05T14:30')).toBe('2026-03-05T09:30:00.000Z')
    expect(api.toDateTimeInput('2026-03-05T09:30:00.000Z')).toBe('2026-03-05T14:30')
    expect(api.fromWallTime('2026-03-05', '14:00')).toBe('2026-03-05T09:00:00.000Z')
    expect(api.toWallTime('2026-03-05T09:00:00+00:00')).toEqual({
      date: '2026-03-05',
      time: '14:00',
    })
    wrapper.unmount()
  })

  test('gives empty values for empty or invalid input', () => {
    const { api, wrapper } = setupHotelTime()

    expect(api.fromDateTimeInput('')).toBe('')
    expect(api.fromDateTimeInput('2026-03-05')).toBe('')
    expect(api.fromWallTime('2026-02-30', '14:00')).toBe('')
    expect(api.toDateTimeInput('')).toBe('')
    expect(api.toDateTimeInput(null)).toBe('')
    expect(api.toDateTimeInput('later')).toBe('')
    expect(api.formatMoment(undefined)).toBe('')
    wrapper.unmount()
  })

  test('formats moments in the UI locale', () => {
    vi.stubEnv('TZ', 'Asia/Tashkent')
    const { api, wrapper } = setupHotelTime()

    expect(api.formatMoment('2026-03-04T23:30:00Z', MEDIUM_DATE)).toBe('Mar 5, 2026')
    i18n.global.locale.value = 'ru'
    expect(api.formatMoment('2026-03-04T23:30:00Z')).toBe('05.03.2026, 04:30')
    i18n.global.locale.value = 'en'
    wrapper.unmount()
  })
})
