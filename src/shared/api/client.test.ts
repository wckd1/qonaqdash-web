import { afterEach, describe, expect, test } from 'vitest'
import api from '@/shared/api/client'
import { useNotification } from '@/shared/composables/useNotification'
import { apiError, fakeAdapter, type FakeResponse } from '@/test-utils/fakeApi'

const routes = new Map<string, () => FakeResponse>()
api.defaults.adapter = fakeAdapter(routes)

const { notifications, dismiss } = useNotification()

/** Messages of the toasts the request left. */
async function toastsOf(method: 'post' | 'put', url: string, answer: FakeResponse) {
  routes.set(`${method.toUpperCase()} ${url}`, () => answer)
  await expect(api.request({ method, url })).rejects.toMatchObject({
    response: { status: answer.status },
  })
  return notifications.map((n) => n.message)
}

afterEach(() => {
  routes.clear()
  for (const n of [...notifications]) dismiss(n.id)
})

const contactRequired = apiError(400, 'guest.contact_required', 'contact required', {
  fields: ['email', 'phone'],
})

describe('API client error toasts', () => {
  // Owner decision on F4 (review), WP2: form errors show at the fields or above the form only.
  test.each([
    ['post', '/api/guests'],
    ['put', '/api/guests/guest-1'],
    ['post', '/api/bookings'],
    ['put', '/api/bookings/booking-1'],
    ['post', '/api/employees'],
    ['put', '/api/employees/employee-1'],
  ] as const)('shows no toast for a 400 with fields on %s %s', async (method, url) => {
    expect(await toastsOf(method, url, contactRequired)).toEqual([])
  })

  test('shows no toast for a 422 validation error of a form write', async () => {
    const answer = apiError(422, 'common.validation_failed', 'validation failed', { issues: [] })

    expect(await toastsOf('post', '/api/guests', answer)).toEqual([])
  })

  test('shows a toast for a 400 without fields on a form write', async () => {
    const answer = apiError(400, 'iam.invalid_email', 'invalid email', { fields: [] })

    expect(await toastsOf('post', '/api/employees', answer)).toHaveLength(1)
  })

  test('shows a toast for a 400 with fields outside the form writes', async () => {
    const answer = apiError(400, 'property.invalid_currency', 'invalid currency', {
      fields: ['currency'],
    })

    expect(await toastsOf('put', '/api/property/hotel', answer)).toHaveLength(1)
  })
})
