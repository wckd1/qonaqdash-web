import { describe, expect, expectTypeOf, test, vi } from 'vitest'
import type { AxiosInstance, AxiosResponse } from 'axios'
import { buildPath, createTypedApi, type Schemas } from '@/shared/api/typed'

function fakeInstance() {
  const request = vi.fn(async (config: unknown) => ({ data: { config } }) as AxiosResponse)
  return { request, client: createTypedApi({ request } as unknown as AxiosInstance) }
}

describe('buildPath', () => {
  test('substitutes and encodes path parameters', () => {
    expect(buildPath('/api/bookings/{id}/check-in', { id: 'a b' })).toBe(
      '/api/bookings/a%20b/check-in',
    )
  })

  test('fails on a missing parameter instead of calling a wrong URL', () => {
    expect(() => buildPath('/api/bookings/{id}', {})).toThrow(/id/)
  })
})

describe('createTypedApi', () => {
  test('passes method, URL, query, body, signal and axios options to axios', async () => {
    const { request, client } = fakeInstance()
    const signal = new AbortController().signal

    await client.put('/api/bookings/{id}/check-out', {
      path: { id: 'b1' },
      body: { force_unpaid: true },
      signal,
      axios: { validateStatus: () => true },
    })
    await client.get('/api/bookings', { query: { q: 'smith' } })

    expect(request).toHaveBeenNthCalledWith(1, {
      method: 'put',
      url: '/api/bookings/b1/check-out',
      params: undefined,
      data: { force_unpaid: true },
      signal,
      validateStatus: expect.any(Function),
    })
    expect(request).toHaveBeenNthCalledWith(2, {
      method: 'get',
      url: '/api/bookings',
      params: { q: 'smith' },
      data: undefined,
      signal: undefined,
    })
  })

  test('sends the header parameters the operation documents', async () => {
    const { request, client } = fakeInstance()

    await client.get('/api/pricing/conditions', { header: { 'If-None-Match': '"h1"' } })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        url: '/api/pricing/conditions',
        headers: { 'If-None-Match': '"h1"' },
      }),
    )
  })

  test('types the response by the contract', () => {
    const { client } = fakeInstance()
    expectTypeOf(client.get<'/api/bookings/{id}'>)
      .returns.resolves.toHaveProperty('data')
      .toEqualTypeOf<Schemas['bookinghttp.BookingItem']>()
    expectTypeOf(client.get<'/api/bookings'>)
      .returns.resolves.toHaveProperty('data')
      .toEqualTypeOf<Schemas['bookinghttp.BookingItem'][]>()
    // Path parameters are required where the contract has them.
    // @ts-expect-error `path` is missing
    void (() => client.get('/api/bookings/{id}', {}))
  })
})
