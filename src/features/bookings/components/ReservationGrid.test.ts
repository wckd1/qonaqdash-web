import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter, type Router } from 'vue-router'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'
import type { BookingItem } from '@/features/bookings/api'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: ReservationGrid } =
  await import('@/features/bookings/components/ReservationGrid.vue')

const LABEL_WIDTH = 118
const COLUMN_WIDTH = 100
/** Gap the grid leaves on each side of a bar. */
const BAR_INSET = 2

const rooms = [{ id: 'r1', number: '101', room_type_id: 't1', room_type_name: 'Standard' }]

/** Two nights, 5 and 6 March, 14:00 to 12:00 on the clock of the hotel in Tashkent (+05:00). */
const booking: BookingItem = {
  id: 'b1',
  status: 'confirmed',
  guest: { first_name: 'Ada', last_name: 'Lovelace' },
  stay: {
    check_in: '2026-03-05T14:00:00+05:00',
    check_out: '2026-03-07T12:00:00+05:00',
    rooms: [{ room_type: 't1', room_id: 'r1' }],
  },
}

let wrapper: VueWrapper | undefined
let router: Router

function hotelIn(timezone: string) {
  http.routes.set('GET /api/property/hotel', () => ({
    status: 200,
    data: {
      id: 'h',
      name: 'City',
      currency: 'KZT',
      check_in_hour: '14:00',
      check_out_hour: '12:00',
      timezone,
    },
  }))
}

beforeEach(async () => {
  // The employee is in Berlin, the hotel in Tashkent: the grid follows the hotel.
  vi.stubEnv('TZ', 'Europe/Berlin')
  hotelIn('Asia/Tashkent')
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date('2026-03-04T06:00:00Z'))
  vi.stubGlobal(
    'ResizeObserver',
    class {
      observe() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLElement.prototype, 'clientWidth', 'get').mockReturnValue(
    LABEL_WIDTH + 7 * COLUMN_WIDTH,
  )
  localStorage.setItem('access_token', makeToken('access', 3600))
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', name: 'dashboard', component: { template: '<div />' } },
      { path: '/bookings/new', name: 'booking-new', component: { template: '<div />' } },
    ],
  })
  await router.push('/')
  await router.isReady()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  vi.useRealTimers()
  vi.unstubAllEnvs()
  localStorage.clear()
  http.routes.clear()
  document.body.innerHTML = ''
})

async function mountGrid(
  props: { entries: BookingItem[]; rangeFrom: string; rangeTo: string } = {
    entries: [booking],
    rangeFrom: '2026-03-03',
    rangeTo: '2026-03-09',
  },
) {
  wrapper = mountWithApp(ReservationGrid, {
    props: { rooms, ...props },
    global: { plugins: [router], stubs: { BookingStatusActions: true } },
    attachTo: document.body,
  })
  await flushPromises()
  return wrapper
}

function cell(day: string) {
  return wrapper!.find(`button[aria-label="Room 101, ${day} — select or open actions"]`)
}

async function selectCells(first: string, last: string) {
  await cell(first).trigger('mousedown', { button: 0 })
  await cell(last).trigger('mouseenter')
  window.dispatchEvent(new MouseEvent('mouseup', { button: 0, clientX: 10, clientY: 10 }))
  await flushPromises()
}

async function createFromMenu() {
  document.querySelector<HTMLButtonElement>('.reservation-cell-menu-item')!.click()
  await flushPromises()
  return router.currentRoute.value.query
}

/** Left offset and width of the first bar, in pixels. */
function barBox() {
  const style = wrapper!.find('.reservation-bar').attributes('style') ?? ''
  return {
    left: Number(/left: ([\d.]+)px/.exec(style)?.[1]),
    width: Number(/width: ([\d.]+)px/.exec(style)?.[1]),
  }
}

describe('ReservationGrid', () => {
  test('has a column per local date of the range with today marked', async () => {
    await mountGrid()

    const heads = wrapper!.findAll('.reservation-grid-head')
    expect(heads).toHaveLength(7)
    expect(heads[0].text()).toBe('3Mar')
    expect(heads[6].text()).toBe('9Mar')
    expect(wrapper!.find('.reservation-grid-head--today').text()).toBe('4Mar')
    expect(cell('2026-03-03').attributes('disabled')).toBeDefined()
    expect(cell('2026-03-04').attributes('disabled')).toBeUndefined()
  })

  test('takes today from the hotel clock', async () => {
    // 21:00 in Berlin on 4 March is already 5 March in Tashkent.
    vi.setSystemTime(new Date('2026-03-04T20:00:00Z'))
    await mountGrid()

    expect(wrapper!.find('.reservation-grid-head--today').text()).toBe('5Mar')
    expect(cell('2026-03-04').attributes('disabled')).toBeDefined()
  })

  test('covers the cells of the nights of the stay', async () => {
    await mountGrid()

    expect(wrapper!.find('.reservation-bar').text()).toBe('Ada Lovelace')
    // Nights of 5 and 6 March: columns 2 and 3.
    expect(barBox()).toEqual({
      left: LABEL_WIDTH + 2 * COLUMN_WIDTH + BAR_INSET,
      width: 2 * COLUMN_WIDTH - 2 * BAR_INSET,
    })
  })

  test('puts the nights on the dates of the hotel, not of the browser', async () => {
    // 01:00 on 6 March in Tashkent is still 5 March in Berlin.
    const lateArrival: BookingItem = {
      ...booking,
      stay: { ...booking.stay, check_in: '2026-03-05T20:00:00Z' },
    }
    await mountGrid({ entries: [lateArrival], rangeFrom: '2026-03-03', rangeTo: '2026-03-09' })

    expect(barBox().left).toBe(LABEL_WIDTH + 3 * COLUMN_WIDTH + BAR_INSET)
  })

  // F5: an arrival on the last visible day was not shown.
  test('shows an arrival on the last visible day', async () => {
    const lastDay: BookingItem = {
      ...booking,
      stay: {
        ...booking.stay,
        check_in: '2026-03-09T14:00:00+05:00',
        check_out: '2026-03-11T12:00:00+05:00',
      },
    }
    await mountGrid({ entries: [lastDay], rangeFrom: '2026-03-03', rangeTo: '2026-03-09' })

    expect(barBox()).toEqual({
      left: LABEL_WIDTH + 6 * COLUMN_WIDTH + BAR_INSET,
      width: COLUMN_WIDTH - 2 * BAR_INSET,
    })
  })

  test('does not start a selection on a booked night', async () => {
    await mountGrid()

    await selectCells('2026-03-06', '2026-03-06')

    expect(document.querySelector('.reservation-cell-menu')).toBeNull()
  })

  // F5: a back-to-back stay could not be selected.
  test('books a back-to-back stay from the check-out day of the previous one', async () => {
    await mountGrid()

    await selectCells('2026-03-07', '2026-03-07')

    expect(await createFromMenu()).toEqual({
      checkIn: '2026-03-07T09:00:00.000Z',
      checkOut: '2026-03-08T07:00:00.000Z',
      roomId: 'r1',
    })
  })

  test('books the selected cells as nights on the hotel clock', async () => {
    await mountGrid()

    await selectCells('2026-03-07', '2026-03-08')

    // Nights of 7 and 8 March: check-out on 9 March at the hotel check-out hour.
    expect(await createFromMenu()).toEqual({
      checkIn: '2026-03-07T09:00:00.000Z',
      checkOut: '2026-03-09T07:00:00.000Z',
      roomId: 'r1',
    })
  })

  test('does not stretch a selection over a booked night', async () => {
    await mountGrid()

    await selectCells('2026-03-04', '2026-03-06')

    // The selection stops at 4 March, before the first booked night.
    expect(await createFromMenu()).toMatchObject({
      checkIn: '2026-03-04T09:00:00.000Z',
      checkOut: '2026-03-05T07:00:00.000Z',
    })
  })

  // Nights were counted in steps of 24 hours from midnight, so after the clock
  // change every night of the booking looked free.
  test('keeps every night booked over a daylight saving change', async () => {
    vi.stubEnv('TZ', 'America/New_York')
    hotelIn('Europe/Berlin')
    vi.setSystemTime(new Date('2026-03-26T10:00:00Z'))
    // 28 to 31 March in Berlin: the clock moves forward on 29 March.
    const overChange: BookingItem = {
      ...booking,
      stay: {
        ...booking.stay,
        check_in: '2026-03-28T14:00:00+01:00',
        check_out: '2026-03-31T12:00:00+02:00',
      },
    }
    await mountGrid({ entries: [overChange], rangeFrom: '2026-03-26', rangeTo: '2026-04-01' })

    for (const night of ['2026-03-28', '2026-03-29', '2026-03-30']) {
      await selectCells(night, night)
      expect(document.querySelector('.reservation-cell-menu'), night).toBeNull()
    }
    await selectCells('2026-03-31', '2026-03-31')
    expect(await createFromMenu()).toMatchObject({
      checkIn: '2026-03-31T12:00:00.000Z',
      checkOut: '2026-04-01T10:00:00.000Z',
    })
  })
})
