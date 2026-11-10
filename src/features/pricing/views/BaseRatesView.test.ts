import { afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'
import en from '@/locales/en.json'

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

const { default: BaseRatesView } = await import('@/features/pricing/views/BaseRatesView.vue')

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  localStorage.clear()
  http.routes.clear()
  http.requests.length = 0
})

const rates = [
  { room_type_id: 'room-type-deluxe', room_type_name: 'Deluxe', base_rate_minor: 4000000 },
  { room_type_id: 'room-type-suite', room_type_name: 'Suite', base_rate_minor: 6500000 },
]

describe('BaseRatesView', () => {
  // Principle 5: a revenue manager without rooms.view sets rates; each rate names its room type.
  test('lists the rates by the room type names they carry and saves them', async () => {
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ pricing: { view: 2, adjust: 2 } }),
    )
    let saved: unknown
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
    http.routes.set('GET /api/pricing/base-rates', () => ({ status: 200, data: { rates } }))
    http.routes.set('PUT /api/pricing/base-rates', (config) => {
      saved = JSON.parse(String(config.data))
      return { status: 200, data: { rates } }
    })

    wrapper = mountWithApp(BaseRatesView, { global: { stubs: { PricingSubNav: true } } })
    await flushPromises()

    expect(wrapper.findAll('tbody tr').map((r) => r.find('td').text())).toEqual(['Deluxe', 'Suite'])
    expect(http.requests.some((r) => r.includes('/api/property/room-types'))).toBe(false)

    await wrapper.find('.base-rates__amount-input').setValue('41000')
    const save = wrapper.findAll('button').find((b) => b.text() === en.common.save)
    await save!.trigger('click')
    await flushPromises()

    expect(saved).toEqual({
      rates: [
        { room_type_id: 'room-type-deluxe', base_rate_minor: 4100000 },
        { room_type_id: 'room-type-suite', base_rate_minor: 6500000 },
      ],
    })
  })
})
