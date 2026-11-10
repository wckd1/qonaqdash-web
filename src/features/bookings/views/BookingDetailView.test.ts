import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import { apiError, type FakeRoute } from '@/test-utils/fakeApi'
import en from '@/locales/en.json'

const BOOKING_ID = 'booking-1'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: BookingDetailView } =
  await import('@/features/bookings/views/BookingDetailView.vue')

const definition = {
  type: 'stack',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      id: 'guest',
      title: 'bookings.form_guest_info',
      children: [
        { type: 'string', id: 'last_name', bind: 'guest.last_name', label: 'fields.last_name' },
      ],
    },
    {
      type: 'group',
      id: 'stay',
      title: 'bookings.form_booking_details',
      children: [
        { type: 'datetime', id: 'check_in', bind: 'stay.check_in', label: 'fields.check_in' },
        { type: 'datetime', id: 'check_out', bind: 'stay.check_out', label: 'fields.check_out' },
      ],
    },
  ],
}

const booking = {
  id: BOOKING_ID,
  status: 'confirmed',
  outstanding_balance: 0,
  _form: { id: 'booking', hash: 'form-hash' },
  guest: { id: 'guest-1', first_name: 'Sarah', last_name: 'Johnson', email: 'sarah@example.test' },
  stay: {
    check_in: '2026-12-01T14:00:00Z',
    check_out: '2026-12-03T12:00:00Z',
    rooms: [{ room_type: 'room-type-1', room_id: null }],
  },
}

const storedQuote = {
  calculated_at: '2026-11-10T10:00:00Z',
  version: 1,
  nights: [],
  nights_subtotal: 0,
  grand_total: 0,
}

function serve() {
  http.routes.clear()
  http.routes.set(`GET /api/bookings/${BOOKING_ID}`, () => ({ status: 200, data: booking }))
  http.routes.set(`GET /api/pricing/bookings/${BOOKING_ID}/quote`, () => ({
    status: 200,
    data: storedQuote,
  }))
  http.routes.set('GET /api/bookings/form', () => ({
    status: 200,
    data: { definition, hash: 'form-hash' },
  }))
  http.routes.set('GET /api/property/hotel', () => ({
    status: 200,
    data: {
      id: 'hotel-1',
      name: 'City',
      currency: 'KZT',
      check_in_hour: '14:00',
      check_out_hour: '12:00',
    },
  }))
  http.routes.set('GET /api/property/room-types', () => ({ status: 200, data: [] }))
  http.routes.set('GET /api/property/rooms/available', () => ({ status: 200, data: [] }))
}

/** Signed in to a hotel with the given booking permissions. */
function signIn(bookings: Record<string, number>) {
  localStorage.setItem('access_token', makeToken('access', 3600))
  localStorage.setItem('qonaqdash.account.permissions', JSON.stringify({ bookings }))
}

let wrapper: VueWrapper | undefined

async function openBooking(): Promise<VueWrapper> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/bookings/:id/details', name: 'booking-detail', component: BookingDetailView },
    ],
  })
  await router.push(`/bookings/${BOOKING_ID}/details`)
  await router.isReady()
  wrapper = mountWithApp(BookingDetailView, {
    global: {
      plugins: [router],
      stubs: {
        BookingStatusActions: true,
        FormView: true,
        FormEdit: true,
        AccommodationSummary: true,
        FolioSection: true,
        QuoteBreakdown: true,
        ManualAdjustmentEditor: true,
      },
    },
  })
  await flushPromises()
  return wrapper
}

function button(w: VueWrapper, label: string) {
  const found = w.findAll('button').find((b) => b.text() === label)
  if (!found) throw new Error(`No button "${label}"`)
  return found
}

beforeEach(() => {
  sessionStorage.clear()
  serve()
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  localStorage.clear()
})

describe('BookingDetailView', () => {
  // WP1-F4: the conflict message stayed until the route changed.
  test('Retry after a concurrent change clears the message and shows the reloaded booking', async () => {
    signIn({ view: 2, modify: 2 })
    http.routes.set(`PUT /api/bookings/${BOOKING_ID}`, () =>
      apiError(409, 'booking.concurrent_modification'),
    )
    const w = await openBooking()

    await button(w, en.common.edit).trigger('click')
    await flushPromises()
    await button(w, en.common.save).trigger('click')
    await flushPromises()

    const conflict = w.find('.error-message')
    expect(conflict.text()).toContain(en.errors.booking.concurrent_modification)

    await button(w, en.common.retry).trigger('click')
    await flushPromises()

    expect(w.find('.error-message').exists()).toBe(false)
    expect(w.findComponent({ name: 'FormView' }).exists()).toBe(true)
    expect(button(w, en.common.edit).exists()).toBe(true)
  })
})
