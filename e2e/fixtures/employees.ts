import { expect, type APIRequestContext } from '@playwright/test'
import { seedUser, type SeedUser } from './seed-users'

/**
 * Employees the e2e scenarios add to Qonaq City Hotel for roles the demo seed
 * does not have. Each is created through the owner on the first run and reused
 * by later runs.
 */
export interface E2eEmployee extends SeedUser {
  firstName: string
  lastName: string
  /** Title of an existing occupation template, or a template to create. */
  occupation:
    | { template: string }
    | { title: string; roleKey: string; permissions: Record<string, Record<string, number>> }
}

export const SUPERVISOR: E2eEmployee = {
  role: 'housekeeping supervisor (e2e)',
  email: 'e2e-supervisor@example.test',
  password: 'supervisor12345',
  firstName: 'Sabina',
  lastName: 'Supervisor',
  occupation: { template: 'iam.occupations.housekeeping_supervisor' },
}

/** Reads bookings and nothing else: no pricing, billing or rooms rights. */
export const BOOKINGS_READER: E2eEmployee = {
  role: 'bookings reader (e2e)',
  email: 'e2e-bookings-reader@example.test',
  password: 'reader12345',
  firstName: 'Rustam',
  lastName: 'Reader',
  occupation: {
    title: 'E2E bookings reader',
    roleKey: 'executive',
    permissions: { bookings: { view: 2 } },
  },
}

/** Bearer headers of a user signed in through the API, without the UI. */
export async function apiSession(request: APIRequestContext, user: SeedUser) {
  const res = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBe(true)
  const { access_token: token } = (await res.json()) as { access_token: string }
  return { Authorization: `Bearer ${token}` }
}

async function occupationId(
  request: APIRequestContext,
  headers: Record<string, string>,
  occupation: E2eEmployee['occupation'],
): Promise<string> {
  const groups = (await (await request.get('/api/occupations', { headers })).json()) as {
    occupations: { id: string; title: string }[]
  }[]
  const title = 'template' in occupation ? occupation.template : occupation.title
  const existing = groups.flatMap((g) => g.occupations).find((o) => o.title === title)
  if (existing) return existing.id
  if ('template' in occupation) throw new Error(`No occupation template ${title}`)
  const created = await request.post('/api/occupations', {
    headers,
    data: { title, role_key: occupation.roleKey, permissions: occupation.permissions },
  })
  expect(created.status()).toBe(201)
  return ((await created.json()) as { id: string }).id
}

/** Makes sure the employee exists with its occupation and can log in. */
export async function ensureEmployee(
  request: APIRequestContext,
  employee: E2eEmployee,
): Promise<void> {
  const login = await request.post('/api/auth/login', {
    data: { email: employee.email, password: employee.password },
  })
  if (login.ok()) return
  const headers = await apiSession(request, seedUser('owner'))
  const created = await request.post('/api/employees', {
    headers,
    data: { first_name: employee.firstName, last_name: employee.lastName, email: employee.email },
  })
  expect(created.status()).toBe(201)
  const { employee: record, invite_token: inviteToken } = (await created.json()) as {
    employee: { id: string }
    invite_token: string
  }
  const assigned = await request.put(`/api/employees/${record.id}/occupations`, {
    headers,
    data: { occupation_ids: [await occupationId(request, headers, employee.occupation)] },
  })
  expect(assigned.ok()).toBe(true)
  const registered = await request.post(`/api/auth/invite/${inviteToken}`, {
    data: { password: employee.password },
  })
  expect(registered.ok()).toBe(true)
}
