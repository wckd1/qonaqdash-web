import { afterEach, describe, expect, test, vi } from 'vitest'
import { useQuery } from '@pinia/colada'
import { setupColada, type ColadaTestContext } from '@/test-utils/colada'

const server = vi.hoisted(() => ({ error: null as unknown }))

vi.mock('@/features/billing/api', () => ({
  fetchGuestBill: vi.fn(async () => {
    throw server.error
  }),
}))

const { billQuery } = await import('@/features/billing/queries')

let ctx: ColadaTestContext

afterEach(() => ctx?.stop())

function notFound(code: string) {
  return { response: { status: 404, data: { error: { code, message: code } } } }
}

describe('billQuery', () => {
  test('has no bill while the booking has none', async () => {
    server.error = notFound('billing.bill_not_found')
    ctx = setupColada()
    const bill = ctx.run(() => useQuery(billQuery('booking-1')))

    await bill.refresh()

    expect(bill.error.value).toBeNull()
    expect(bill.data.value).toBeNull()
  })

  // WP2: a booking of another hotel or organization is not found, not a booking without a bill.
  test('fails when the booking is not found', async () => {
    server.error = notFound('billing.booking_not_found')
    ctx = setupColada()
    const bill = ctx.run(() => useQuery(billQuery('booking-1')))

    await bill.refresh()

    expect(bill.error.value).toBe(server.error)
  })
})
