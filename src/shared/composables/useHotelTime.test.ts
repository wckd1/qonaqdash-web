import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { defineComponent, h } from 'vue'
import { flushPromises } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'
import { i18n } from '@/i18n'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { provideHotelTime, useHotelTime } = await import('@/shared/composables/useHotelTime')
type HotelTime = ReturnType<typeof useHotelTime>

function hotelIn(timezone: string): FakeRoute {
  return () => ({
    status: 200,
    data: {
      id: 'h',
      name: 'City',
      currency: 'KZT',
      check_in_hour: '14:00',
      check_out_hour: '12:00',
      timezone,
    },
  })
}

async function setupHotelTime(timezone: string | null = 'Asia/Tashkent') {
  http.routes.set(
    'GET /api/property/hotel',
    timezone ? hotelIn(timezone) : () => ({ status: 500, data: {} }),
  )
  let api: HotelTime | undefined
  const Probe = defineComponent({
    setup() {
      api = useHotelTime()
      return () => null
    },
  })
  const wrapper = mountWithApp(Probe)
  return { api: api!, wrapper }
}

beforeEach(() => {
  localStorage.setItem('access_token', makeToken('access', 3600))
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  localStorage.clear()
  http.routes.clear()
  i18n.global.locale.value = 'en'
})

describe('useHotelTime', () => {
  test('takes the time zone of the hotel once it has loaded', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')

    // Until the hotel loads, the zone of the browser.
    expect(api.ready.value).toBe(false)
    expect(api.timeZone.value).toBe('Europe/Berlin')
    const waited = api.whenReady()
    await flushPromises()
    await waited

    expect(api.ready.value).toBe(true)
    expect(api.timeZone.value).toBe('Asia/Tashkent')
    wrapper.unmount()
  })

  test('keeps the zone of the browser when the hotel cannot be loaded', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    const { api, wrapper } = await setupHotelTime(null)
    await flushPromises()

    expect(api.ready.value).toBe(true)
    expect(api.timeZone.value).toBe('Europe/Berlin')
    wrapper.unmount()
  })

  test('today is the local date of the hotel, not of the browser', async () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')
    vi.useFakeTimers({ toFake: ['Date'] })
    // 20:30 UTC: 5 March in Tashkent (+05:00), still 4 March in Los Angeles.
    vi.setSystemTime(new Date('2026-03-04T20:30:00Z'))
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')
    await flushPromises()

    expect(api.today()).toBe('2026-03-05')
    expect(api.localDateOf('2026-03-04T18:59:00Z')).toBe('2026-03-04')
    wrapper.unmount()
  })

  test('converts the hotel clock of an input to a moment and back', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')
    await flushPromises()

    expect(api.fromDateTimeInput('2026-03-05T14:30')).toBe('2026-03-05T09:30:00.000Z')
    expect(api.toDateTimeInput('2026-03-05T14:30:00+05:00')).toBe('2026-03-05T14:30')
    expect(api.fromWallTime('2026-03-05', '14:00')).toBe('2026-03-05T09:00:00.000Z')
    expect(api.toWallTime('2026-03-05T09:00:00Z')).toEqual({ date: '2026-03-05', time: '14:00' })
    wrapper.unmount()
  })

  test('gives empty values for empty or invalid input', async () => {
    const { api, wrapper } = await setupHotelTime()
    await flushPromises()

    expect(api.fromDateTimeInput('')).toBe('')
    expect(api.fromDateTimeInput('2026-03-05')).toBe('')
    expect(api.fromWallTime('2026-02-30', '14:00')).toBe('')
    expect(api.toDateTimeInput('')).toBe('')
    expect(api.toDateTimeInput(null)).toBe('')
    expect(api.toDateTimeInput('later')).toBe('')
    expect(api.formatMoment(undefined)).toBe('')
    expect(api.employeeTime('')).toBe('')
    wrapper.unmount()
  })

  test('formats moments on the hotel clock in the UI locale', async () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')
    await flushPromises()

    i18n.global.locale.value = 'ru'
    expect(api.formatMoment('2026-03-04T23:30:00Z')).toBe('05.03.2026, 04:30')
    wrapper.unmount()
  })

  test('labels the hotel zone and gives the employee time when the clocks differ', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')
    await flushPromises()

    i18n.global.locale.value = 'ru'
    expect(api.zoneLabel('2026-03-05T09:30:00Z')).toBe('GMT+5')
    expect(api.employeeTime('2026-03-05T09:30:00Z')).toBe('05.03.2026, 10:30 GMT+1')
    expect(api.zoneLabel()).toBe('GMT+5')
    wrapper.unmount()
  })

  test('shows no label when the browser clock shows the hotel time', async () => {
    // Another zone with the same clock as Tashkent.
    vi.stubEnv('TZ', 'Asia/Karachi')
    const { api, wrapper } = await setupHotelTime('Asia/Tashkent')
    await flushPromises()

    expect(api.zoneLabel('2026-03-05T09:30:00Z')).toBe('')
    expect(api.employeeTime('2026-03-05T09:30:00Z')).toBe('')
    wrapper.unmount()
  })

  test('the app shell shares one hotel time with every screen below it', async () => {
    http.routes.set('GET /api/property/hotel', hotelIn('Asia/Tashkent'))
    let provided: HotelTime | undefined
    let used: HotelTime | undefined
    const Child = defineComponent({
      setup() {
        used = useHotelTime()
        return () => null
      },
    })
    const Shell = defineComponent({
      setup() {
        provided = provideHotelTime()
        return () => h(Child)
      },
    })
    const wrapper = mountWithApp(Shell)

    expect(used).toBe(provided)
    wrapper.unmount()
  })
})
