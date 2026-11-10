import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: MomentTime } = await import('@/shared/components/MomentTime.vue')
const { default: HotelZoneHint } = await import('@/shared/components/HotelZoneHint.vue')

/** 14:30 in Tashkent (+05:00), 10:30 in Berlin (+01:00). */
const MOMENT = '2026-03-05T09:30:00Z'

let wrapper: VueWrapper | undefined

beforeEach(() => {
  localStorage.setItem('access_token', makeToken('access', 3600))
  http.routes.set('GET /api/property/hotel', () => ({
    status: 200,
    data: {
      id: 'h',
      name: 'City',
      currency: 'KZT',
      check_in_hour: '14:00',
      check_out_hour: '12:00',
      timezone: 'Asia/Tashkent',
    },
  }))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.unstubAllEnvs()
  localStorage.clear()
  http.routes.clear()
})

/** Intl puts a narrow no-break space before AM/PM in some ICU versions. */
function spaces(value: string | undefined): string {
  return (value ?? '').replace(/\s/g, ' ')
}

async function mountMoment(props: Record<string, unknown>) {
  wrapper = mountWithApp(MomentTime, { props: props as never })
  await flushPromises()
  return wrapper
}

describe('MomentTime', () => {
  test('shows the hotel clock with the zone label and the employee time on hover', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    await mountMoment({ value: MOMENT })

    const time = wrapper!.find('time')
    expect(time.attributes('datetime')).toBe(MOMENT)
    expect(spaces(time.text())).toBe('3/5/26, 2:30 PM GMT+5')
    expect(wrapper!.find('.moment-time__zone').text()).toBe('GMT+5')
    expect(spaces(time.attributes('title'))).toBe('Your time: 3/5/26, 10:30 AM GMT+1')
  })

  test('shows only the time when the browser clock shows the hotel time', async () => {
    vi.stubEnv('TZ', 'Asia/Karachi')
    await mountMoment({ value: MOMENT })

    expect(spaces(wrapper!.find('time').text())).toBe('3/5/26, 2:30 PM')
    expect(wrapper!.find('.moment-time__zone').exists()).toBe(false)
    expect(wrapper!.find('time').attributes('title')).toBeUndefined()
  })

  test('shows the date of the hotel without a label for a date only', async () => {
    vi.stubEnv('TZ', 'America/Los_Angeles')
    // 23:30 UTC on 4 March is 5 March in Tashkent and still 4 March in Los Angeles.
    await mountMoment({ value: '2026-03-04T23:30:00Z', dateOnly: true })

    expect(wrapper!.find('time').text()).toBe('Mar 5, 2026')
    expect(wrapper!.find('.moment-time__zone').exists()).toBe(false)
    expect(spaces(wrapper!.find('time').attributes('title'))).toBe(
      'Your time: 3/4/26, 3:30 PM GMT-8',
    )
  })

  test('shows the empty text without a value', async () => {
    await mountMoment({ value: null, empty: '—' })

    expect(wrapper!.find('time').exists()).toBe(false)
    expect(wrapper!.text()).toBe('—')
  })
})

describe('HotelZoneHint', () => {
  test('tells that the input is on the hotel clock when the browser clock differs', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    wrapper = mountWithApp(HotelZoneHint, { props: { value: MOMENT } })
    await flushPromises()

    const hint = wrapper.find('.hotel-zone-hint')
    expect(hint.text()).toBe('Hotel time, GMT+5')
    expect(spaces(hint.attributes('title'))).toBe('Your time: 3/5/26, 10:30 AM GMT+1')
  })

  test('is not shown when the clocks agree', async () => {
    vi.stubEnv('TZ', 'Asia/Karachi')
    wrapper = mountWithApp(HotelZoneHint, { props: { value: '' } })
    await flushPromises()

    expect(wrapper.find('.hotel-zone-hint').exists()).toBe(false)
  })
})
