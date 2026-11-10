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
})
