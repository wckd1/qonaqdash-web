import { afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
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

const { default: FolioSection } = await import('@/features/billing/components/FolioSection.vue')

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  localStorage.clear()
  http.routes.clear()
  http.requests.length = 0
})

describe('FolioSection', () => {
  // Principle 5: a cashier reads the bill without rooms.view; the entry names its room type.
  test('names the room type of a night from the entry', async () => {
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ billing: { collect_payment: 2 } }),
    )
    http.routes.set('GET /api/billing/bookings/booking-1/bill', () => ({
      status: 200,
      data: {
        bill: { id: 'bill-1', booking_id: 'booking-1', status: 'open', currency: 'KZT' },
        outstanding_balance: 6500000,
        entries: [
          {
            id: 'entry-1',
            entry_type: 'accommodation_night',
            amount: 6500000,
            created_at: '2026-12-01T10:00:00Z',
            metadata: {
              date: '2026-12-01',
              room_type_id: 'room-type-suite',
              room_type_name: 'Suite',
            },
          },
        ],
      },
    }))

    wrapper = mountWithApp(FolioSection, {
      props: { bookingId: 'booking-1', bookingStatus: 'checked_in', currency: 'KZT' },
      global: { stubs: { teleport: true } },
    })
    await flushPromises()

    expect(wrapper.find('.folio-section__table-wrap').text()).toContain('Suite')
    expect(http.requests.some((r) => r.includes('/api/property/room-types'))).toBe(false)
  })
})
