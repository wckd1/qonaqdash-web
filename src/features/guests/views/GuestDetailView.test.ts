import { afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'
import en from '@/locales/en.json'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: GuestDetailView } = await import('@/features/guests/views/GuestDetailView.vue')

const definition = {
  type: 'stack',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      id: 'main',
      children: [{ type: 'string', id: 'last_name', bind: 'last_name', label: 'fields.last_name' }],
    },
  ],
}

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  localStorage.clear()
  sessionStorage.clear()
  http.routes.clear()
})

async function openGuest(permissions: Record<string, Record<string, number>>) {
  localStorage.setItem('access_token', makeToken('access', 3600))
  localStorage.setItem('qonaqdash.account.permissions', JSON.stringify(permissions))
  http.routes.set('GET /api/guests/guest-1', () => ({
    status: 200,
    data: {
      id: 'guest-1',
      first_name: 'Sarah',
      last_name: 'Johnson',
      email: 'sarah@example.test',
      _form: { id: 'guest', hash: 'form-hash' },
    },
  }))
  http.routes.set('GET /api/guests/form', () => ({
    status: 200,
    data: { definition, hash: 'form-hash' },
  }))
  http.routes.set('GET /api/guests/guest-1/bookings', () => ({
    status: 200,
    data: [
      {
        id: 'booking-1',
        status: 'checked_out',
        guest: { id: 'guest-1' },
        stay: { check_in: '2026-11-04T14:00:00Z', check_out: '2026-11-07T12:00:00Z', rooms: [] },
      },
    ],
  }))
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/guests/:id/details', name: 'guest-detail', component: GuestDetailView },
      { path: '/guests', name: 'guests', component: GuestDetailView },
      { path: '/bookings/:id/details', name: 'booking-detail', component: GuestDetailView },
    ],
  })
  await router.push('/guests/guest-1/details')
  await router.isReady()
  wrapper = mountWithApp(GuestDetailView, {
    global: { plugins: [router], stubs: { FormView: true, FormEdit: true } },
  })
  await flushPromises()
  return wrapper
}

describe('GuestDetailView', () => {
  // Principle 5: the stays of a guest are part of the guest card (guests.view reads them).
  test('shows the stays of the guest to a role without bookings.view', async () => {
    const w = await openGuest({ guests: { view: 2 } })

    expect(w.find('.related-records').text()).toContain(en.guests.bookings_heading)
    expect(w.findAll('.related-records tbody tr')).toHaveLength(1)
    // Opening a booking is its own resource and needs bookings.view.
    expect(w.find('.related-records a').exists()).toBe(false)
  })

  test('links the stays to their bookings for a booking reader', async () => {
    const w = await openGuest({ guests: { view: 2 }, bookings: { view: 2 } })

    expect(w.find('.related-records a').text()).toBe(en.common.view)
  })
})
