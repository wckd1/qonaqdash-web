import { afterEach, describe, expect, test } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import QuoteBreakdown from '@/features/bookings/components/QuoteBreakdown.vue'
import AccommodationSummary from '@/features/bookings/components/AccommodationSummary.vue'
import type { StayQuoteNight } from '@/features/pricing/api'

/** Two nights of one Suite; the night carries the room type name (principle 5). */
const nights: StayQuoteNight[] = ['2026-12-01', '2026-12-02'].map((date) => ({
  date,
  room_type_id: 'room-type-suite',
  room_type_name: 'Suite',
  base_rate: 6500000,
  adjustments: [],
  subtotal: 6500000,
}))

let wrapper: VueWrapper | undefined

afterEach(() => wrapper?.unmount())

describe('room type names of a quote', () => {
  test('the quote preview names the room type from the nights', () => {
    wrapper = mountWithApp(QuoteBreakdown, {
      props: {
        quote: { nights, nights_subtotal: 13000000, total_adjustments: [], grand_total: 13000000 },
        currency: 'KZT',
        loading: false,
        error: '',
      },
    })

    expect(wrapper.find('.pricing-card__row').text()).toContain('Suite')
    expect(wrapper.text()).not.toContain('room-type-suite')
  })

  test('the stored quote names the room type from the nights', () => {
    wrapper = mountWithApp(AccommodationSummary, {
      props: {
        accommodation: {
          calculated_at: '2026-11-10T10:00:00Z',
          version: 1,
          nights,
          nights_subtotal: 13000000,
          total_adjustments: [],
          grand_total: 13000000,
        },
        currency: 'KZT',
      },
      global: { stubs: { teleport: true } },
    })

    expect(wrapper.find('.pricing-card__row').text()).toContain('Suite')
    expect(wrapper.text()).not.toContain('room-type-suite')
  })
})
