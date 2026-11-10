import { afterEach, describe, expect, test, vi } from 'vitest'
import { defineComponent } from 'vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'

const http = vi.hoisted(() => {
  const requests: string[] = []
  class RecordingRoutes extends Map<string, FakeRoute> {
    override get(key: string) {
      requests.push(key)
      return super.get(key)
    }
  }
  return { routes: new RecordingRoutes(), requests }
})

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: DashboardView } = await import('@/features/dashboard/views/DashboardView.vue')

/** Stands in for the grid and keeps the rows it was given. */
const GridStub = defineComponent({
  name: 'ReservationGrid',
  props: { rooms: { type: Array, default: () => [] } },
  template: '<div class="grid-stub" />',
})

function room(number: string, typeId: string, typeName: string, state = 'selectable') {
  return { id: `room-${number}`, number, room_type_id: typeId, room_type_name: typeName, state }
}

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  vi.useRealTimers()
  vi.unstubAllEnvs()
  localStorage.clear()
  http.routes.clear()
  http.requests.length = 0
})

describe('DashboardView', () => {
  // F16, principle 5: a receptionist reads bookings but not rooms; the grid still has its rows.
  test('takes the grid rows from the hotel rooms, blocked ones included', async () => {
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem('qonaqdash.account.permissions', JSON.stringify({ bookings: { view: 2 } }))
    http.routes.set('GET /api/property/rooms/available', () => ({
      status: 200,
      data: [
        room('102', 'type-standard', 'Standard'),
        room('101', 'type-standard', 'Standard'),
        room('302', 'type-suite', 'Suite', 'blocked_by_maintenance'),
      ],
    }))
    http.routes.set('GET /api/bookings/grid', () => ({ status: 200, data: [] }))
    http.routes.set('GET /api/property/hotel', () => ({
      status: 200,
      data: {
        id: 'h',
        name: 'City',
        currency: 'KZT',
        check_in_hour: '14:00',
        check_out_hour: '12:00',
      },
    }))
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'dashboard', component: DashboardView }],
    })
    await router.push('/')
    await router.isReady()

    wrapper = mountWithApp(DashboardView, {
      global: {
        plugins: [router],
        stubs: { ReservationGrid: GridStub, BookingSidePanel: true },
      },
    })
    await flushPromises()

    const rows = wrapper.findComponent(GridStub).props('rooms') as { number: string }[]
    expect(rows.map((r) => r.number)).toEqual(['101', '102', '302'])
    expect(
      http.requests.filter((r) => r.endsWith('/api/property/rooms') || r.includes('room-types')),
    ).toEqual([])
  })

  // F5, F6: the window starts from the hotel today and the grid asks for [from, to).
  test('opens the window around the hotel today and asks the grid for the day after the last column', async () => {
    vi.stubEnv('TZ', 'Europe/Berlin')
    vi.useFakeTimers({ toFake: ['Date'] })
    // 21:00 on 4 March in Berlin is already 5 March in Tashkent.
    vi.setSystemTime(new Date('2026-03-04T20:00:00Z'))
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem('qonaqdash.account.permissions', JSON.stringify({ bookings: { view: 2 } }))
    const gridParams: unknown[] = []
    http.routes.set('GET /api/property/rooms/available', () => ({ status: 200, data: [] }))
    http.routes.set('GET /api/bookings/grid', (config) => {
      gridParams.push(config.params)
      return { status: 200, data: [] }
    })
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
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [{ path: '/', name: 'dashboard', component: DashboardView }],
    })
    await router.push('/')
    await router.isReady()

    wrapper = mountWithApp(DashboardView, {
      global: {
        plugins: [router],
        stubs: { ReservationGrid: GridStub, BookingSidePanel: true },
      },
    })
    await flushPromises()

    // 14 columns: yesterday of the hotel, today, then 12 more days.
    expect(router.currentRoute.value.query).toEqual({ from: '2026-03-04', to: '2026-03-17' })
    expect(gridParams).toEqual([{ from: '2026-03-04', to: '2026-03-18' }])
  })
})
