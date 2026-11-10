import { beforeEach, describe, expect, test, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/client', () => ({ default: { request }, refreshTransport: { request } }))

const { fetchAvailableRooms } = await import('@/features/property/api')

beforeEach(() => {
  request.mockReset()
  request.mockResolvedValue({ status: 200, data: [] })
})

describe('fetchAvailableRooms', () => {
  // The picker takes the moments of the stay, as the booking write does; dd.MM.yyyy is gone.
  test('sends the moments of the stay as they are', async () => {
    await fetchAvailableRooms(
      { checkIn: '2026-03-05T14:00:00+05:00', checkOut: '2026-03-07T07:00:00.000Z' },
      { excludeBookingId: ' b1 ' },
    )

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'get',
        url: '/api/property/rooms/available',
        params: {
          check_in: '2026-03-05T14:00:00+05:00',
          check_out: '2026-03-07T07:00:00.000Z',
          exclude: 'b1',
        },
      }),
    )
  })

  test('lists every room of the hotel without a stay', async () => {
    await fetchAvailableRooms(null, { excludeBookingId: 'b1' })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/api/property/rooms/available', params: {} }),
    )
  })
})
