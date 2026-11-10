import { beforeEach, describe, expect, test, vi } from 'vitest'

const request = vi.hoisted(() => vi.fn())

vi.mock('@/shared/api/client', () => ({ default: { request }, refreshTransport: { request } }))

const { createEmployee, updateEmployee } = await import('@/features/employees/api')

const permissions = { bookings: { view: 2 } }

/** Employee as the edit form gets it from `GET /api/employees/{id}`, with a custom field. */
const employeeFromResponse = {
  id: 'e-1',
  _form: { id: 'employee', hash: 'h1' },
  first_name: 'Rauan',
  last_name: 'Reception',
  email: 'reception@example.test',
  phone: null,
  badge: 'R-7',
  occupation_ids: ['o-1'],
  occupations: [{ id: 'o-1', title: 'Receptionist', role_key: 'front_office', role_title: 'x' }],
  effective_permissions: permissions,
  permission_overrides: {},
}

beforeEach(() => {
  request.mockReset()
  request.mockResolvedValue({ status: 200, data: employeeFromResponse })
})

describe('employee writes', () => {
  test('PUT sends the profile fields without identity, form and access settings', async () => {
    await updateEmployee('e-1', { ...employeeFromResponse })

    expect(request).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'put',
        url: '/api/employees/e-1',
        data: {
          first_name: 'Rauan',
          last_name: 'Reception',
          email: 'reception@example.test',
          phone: null,
          badge: 'R-7',
        },
      }),
    )
  })

  test('the created employee carries its id for "open employee"', async () => {
    request.mockResolvedValue({
      status: 201,
      data: { employee: employeeFromResponse, invite_token: 't-1' },
    })

    const created = await createEmployee({
      first_name: 'Rauan',
      last_name: 'Reception',
      email: 'r@x',
    })

    expect(created.employee.id).toBe('e-1')
    expect(request.mock.calls[0][0].data).toEqual({
      first_name: 'Rauan',
      last_name: 'Reception',
      email: 'r@x',
    })
  })
})
