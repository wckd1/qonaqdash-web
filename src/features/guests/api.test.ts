import { beforeEach, describe, expect, test, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/client', () => ({ default: { request }, refreshTransport: { request } }))

const { createGuest, updateGuest } = await import('@/features/guests/api')

/** Guest as the edit form gets it from `GET /api/guests/{id}`, with a custom field. */
const guestFromResponse = {
  id: 'g-1',
  blocked: false,
  _form: { id: 'guest', hash: 'h1' },
  first_name: 'Aida',
  last_name: 'Nur',
  email: 'aida@example.test',
  passport_number: 'N123',
}

const savedGuest = { ...guestFromResponse, _form: { id: 'guest', hash: 'h1' } }

beforeEach(() => {
  request.mockReset()
  request.mockResolvedValue({ status: 200, data: savedGuest })
})

describe('guest writes', () => {
  // Contract criterion 4a: the server owns id, blocked and _form; the body carries the profile only.
  test('PUT sends the profile fields without id, blocked and _form', async () => {
    await updateGuest('g-1', { ...guestFromResponse })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'put',
        url: '/api/guests/g-1',
        data: {
          first_name: 'Aida',
          last_name: 'Nur',
          email: 'aida@example.test',
          passport_number: 'N123',
        },
      }),
    )
  })

  test('POST sends the profile fields without id, blocked and _form', async () => {
    await createGuest({ id: null, blocked: false, first_name: 'Aida', last_name: 'Nur' })

    expect(request.mock.calls[0][0].data).toEqual({ first_name: 'Aida', last_name: 'Nur' })
  })

  test('the saved guest keeps the id from the response', async () => {
    const { data } = await updateGuest('g-1', { ...guestFromResponse })

    expect(data.id).toBe('g-1')
  })
})
