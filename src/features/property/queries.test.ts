import { afterEach, describe, expect, test, vi } from 'vitest'
import { useQuery } from '@pinia/colada'
import { setupColada, type ColadaTestContext } from '@/test-utils/colada'
import type { Hotel } from '@/features/property/api'

const server = vi.hoisted(() => ({
  hotel: {
    id: 'hotel-1',
    name: 'City',
    currency: 'KZT',
    check_in_hour: '14:00',
    check_out_hour: '12:00',
  } as Hotel,
}))

vi.mock('@/features/property/api', () => ({
  fetchHotel: vi.fn(async () => ({ ...server.hotel })),
  updateHotel: vi.fn(async (body: Omit<Hotel, 'id'>) => {
    server.hotel = { ...server.hotel, ...body }
    return { ...server.hotel }
  }),
}))

const { hotelQuery, useUpdateHotelMutation } = await import('@/features/property/queries')

let ctx: ColadaTestContext

afterEach(() => ctx?.stop())

describe('useUpdateHotelMutation', () => {
  // F8: screens that read the hotel see the saved currency and hours without a reload.
  test('refreshes the hotel query that other screens read', async () => {
    ctx = setupColada()
    const hotel = ctx.run(() => useQuery(hotelQuery))
    await hotel.refresh()
    expect(hotel.data.value?.currency).toBe('KZT')

    const { mutateAsync } = ctx.run(() => useUpdateHotelMutation())
    await mutateAsync({
      name: 'City',
      currency: 'USD',
      check_in_hour: '15:30',
      check_out_hour: '11:00',
    })

    expect(hotel.data.value?.currency).toBe('USD')
    expect(hotel.data.value?.check_in_hour).toBe('15:30')
    expect(hotel.data.value?.check_out_hour).toBe('11:00')
  })
})
