import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>(), bodies: [] as unknown[] }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: HotelSettingsView } =
  await import('@/features/property/views/HotelSettingsView.vue')

const hotel = {
  id: 'h',
  name: 'City',
  currency: 'KZT',
  check_in_hour: '14:00',
  check_out_hour: '12:00',
  timezone: 'Asia/Almaty',
}

let wrapper: VueWrapper | undefined

beforeEach(() => {
  localStorage.setItem('access_token', makeToken('access', 3600))
  localStorage.setItem('qonaqdash.account.permissions', JSON.stringify({ hotel: { manage: 2 } }))
  http.routes.set('GET /api/property/hotel', () => ({ status: 200, data: { ...hotel } }))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  localStorage.clear()
  http.routes.clear()
  http.bodies.length = 0
})

async function mountSettings() {
  wrapper = mountWithApp(HotelSettingsView, { global: { stubs: { PropertySubNav: true } } })
  await flushPromises()
  return wrapper
}

function zoneSelect() {
  return wrapper!.find<HTMLSelectElement>('select')
}

async function save() {
  await wrapper!.find('.page-header-actions button').trigger('click')
  await flushPromises()
}

describe('HotelSettingsView time zone', () => {
  test('offers the IANA zones with their offset and selects the hotel zone', async () => {
    await mountSettings()

    expect(zoneSelect().element.value).toBe('Asia/Almaty')
    const labels = zoneSelect()
      .findAll('option')
      .map((o) => o.text())
    expect(labels).toContain('Asia/Tashkent (GMT+5)')
    expect(labels).toContain('Europe/Berlin (GMT+1)')
  })

  test('sends the time zone only when it changed', async () => {
    http.routes.set('PUT /api/property/hotel', (config) => {
      http.bodies.push(JSON.parse(String(config.data)))
      return { status: 200, data: { ...hotel, ...JSON.parse(String(config.data)) } }
    })
    await mountSettings()

    await wrapper!.find('input[type="text"]').setValue('City Center')
    await save()
    await zoneSelect().setValue('Asia/Tashkent')
    await save()

    expect(http.bodies).toEqual([
      expect.not.objectContaining({ timezone: expect.anything() }),
      expect.objectContaining({ name: 'City Center', timezone: 'Asia/Tashkent' }),
    ])
  })

  test('explains why the zone cannot change while the hotel has bookings', async () => {
    http.routes.set('PUT /api/property/hotel', () => ({
      status: 409,
      data: {
        error: {
          code: 'property.timezone_locked_by_bookings',
          message: 'hotel has active or future bookings',
        },
      },
    }))
    await mountSettings()

    await zoneSelect().setValue('Asia/Tashkent')
    await save()

    expect(wrapper!.find('.form-field-error').text()).toBe(
      'The time zone cannot be changed while the hotel has current or future bookings: their nights would shift',
    )
  })
})
