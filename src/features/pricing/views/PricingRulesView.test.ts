import { afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { ConditionCandidatesResult, PricingRule } from '@/features/pricing/api'

const SUITE_ID = 'room-type-suite'

const server = vi.hoisted(() => ({
  rules: [] as PricingRule[],
  candidates: { conditions: [], hash: '' } as ConditionCandidatesResult,
}))

const updatePricingRule = vi.hoisted(() =>
  vi.fn(async (id: string, body: object) => ({ id, ...body })),
)

vi.mock('@/features/pricing/api', () => ({
  fetchPricingRules: vi.fn(async () => server.rules),
  fetchConditionCandidates: vi.fn(async () => server.candidates),
  updatePricingRule,
}))

vi.mock('@/features/property/api', () => ({
  fetchHotel: vi.fn(async () => ({
    id: 'hotel-1',
    name: 'City',
    currency: 'KZT',
    check_in_hour: '14:00',
    check_out_hour: '12:00',
  })),
}))

const { default: PricingRulesView } = await import('@/features/pricing/views/PricingRulesView.vue')

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  localStorage.clear()
})

describe('PricingRulesView', () => {
  // WP1-F1: room type names come from the server and are not i18n keys.
  test('shows server labels as they are, without missing-key warnings', async () => {
    server.rules = [
      {
        id: 'rule-1',
        name: 'Suite premium',
        priority: 1,
        status: 'active',
        invalid_reason: null,
        conditions: [{ type: 'property', field_id: 'room_type', operator: 'eq', value: SUITE_ID }],
        effect: { type: 'percent', value: 2000, apply_to: 'per_night' },
        created_at: '2026-11-10T10:00:00Z',
        updated_at: '2026-11-10T10:00:00Z',
      },
    ]
    server.candidates = {
      conditions: [
        {
          bind: 'room_type',
          field_id: 'room_type',
          label: 'fields.room_type',
          type: 'select',
          options: [
            { label: 'fields.any', value: null },
            { label: 'Suite', value: SUITE_ID },
          ],
        },
      ],
      hash: 'hash-1',
    }
    // A pricing manager in a hotel, so the rule can be opened for editing.
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ pricing: { manage: 2 } }),
    )
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {})

    wrapper = mountWithApp(PricingRulesView, {
      global: { stubs: { PricingSubNav: true, teleport: true } },
    })
    await flushPromises()

    expect(wrapper.find('.pricing-rule__summary').text()).toContain('Room type = Suite')

    await wrapper.find('.list-table__action').trigger('click')
    const [field, , value] = wrapper.findAll('.condition-row__field')
    expect(field!.findAll('option').map((o) => o.text())).toContain('Room type')
    expect(value!.findAll('option').map((o) => o.text())).toEqual(
      expect.arrayContaining(['Any', 'Suite']),
    )

    const missingKeys = warn.mock.calls
      .map((args) => String(args[0]))
      .filter((message) => message.includes('Not found'))
    expect(missingKeys).toEqual([])
  })

  // The rule keeps the nights [from, to); the form shows the first and the last night.
  test('shows the last night of a date range and saves the day after it', async () => {
    server.rules = [
      {
        id: 'rule-ny',
        name: 'New Year',
        priority: 1,
        status: 'active',
        invalid_reason: null,
        conditions: [{ type: 'date_range', from: '2026-12-25', to: '2027-01-08' }],
        effect: { type: 'percent', value: 2000, apply_to: 'per_night' },
        created_at: '2026-11-10T10:00:00Z',
        updated_at: '2026-11-10T10:00:00Z',
      },
    ]
    server.candidates = { conditions: [], hash: 'hash-1' }
    localStorage.setItem('access_token', makeToken('access', 3600))
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ pricing: { manage: 2 } }),
    )

    wrapper = mountWithApp(PricingRulesView, {
      global: { stubs: { PricingSubNav: true, teleport: true } },
    })
    await flushPromises()

    expect(wrapper.find('.pricing-rule__summary').text()).toContain('2026-12-25 — 2027-01-07')

    await wrapper.find('.list-table__action').trigger('click')
    const [from, last] = wrapper.findAll<HTMLInputElement>('input[type="date"]')
    expect(from!.element.value).toBe('2026-12-25')
    expect(last!.element.value).toBe('2027-01-07')

    await last!.setValue('2027-01-10')
    await wrapper.find('form.rule-form').trigger('submit')
    await flushPromises()

    expect(updatePricingRule).toHaveBeenCalledWith(
      'rule-ny',
      expect.objectContaining({
        conditions: [{ type: 'date_range', from: '2026-12-25', to: '2027-01-11' }],
      }),
    )
  })
})
