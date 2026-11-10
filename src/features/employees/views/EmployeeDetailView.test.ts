import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type DOMWrapper, type VueWrapper } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'
import en from '@/locales/en.json'

const OWNER_ID = 'employee-owner'
const DIRECTOR_ID = 'employee-director'

const http = vi.hoisted(() => {
  const requests: string[] = []
  class RecordingRoutes extends Map<string, FakeRoute> {
    override get(key: string) {
      requests.push(key)
      return super.get(key)
    }
  }
  return { routes: new RecordingRoutes(), requests }
})

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: EmployeeDetailView } =
  await import('@/features/employees/views/EmployeeDetailView.vue')

const managerAccess = {
  bookings: { view: 2 },
  hotel: { view: 2, manage_permissions: 2 },
  employees: { view: 2, manage: 2 },
}

const definition = {
  type: 'stack',
  direction: 'vertical',
  children: [
    {
      type: 'group',
      id: 'main',
      children: [{ type: 'string', id: 'last_name', bind: 'last_name', label: 'fields.last_name' }],
    },
  ],
}

function employee(id: string, isOwner: boolean) {
  return {
    id,
    email: `${id}@example.test`,
    first_name: isOwner ? 'Olga' : 'Dana',
    last_name: isOwner ? 'Owner' : 'Director',
    _form: { id: 'employee', hash: 'form-hash' },
    effective_permissions: managerAccess,
    permission_overrides: {},
    occupation_ids: [],
    occupations: [],
    is_owner: isOwner,
  }
}

/** Signed in as the director: a permission manager, not the owner. */
function signInAsDirector() {
  localStorage.setItem('access_token', makeToken('access', 3600))
  localStorage.setItem('qonaqdash.account.permissions', JSON.stringify(managerAccess))
  http.routes.set('GET /api/account', () => ({
    status: 200,
    data: {
      account: { email: 'director@example.test' },
      profile: { first_name: 'Dana', last_name: 'Director' },
      settings: { locale: null },
      permissions: managerAccess,
      is_owner: false,
      employee_id: DIRECTOR_ID,
    },
  }))
  for (const [id, owner] of [
    [OWNER_ID, true],
    [DIRECTOR_ID, false],
  ] as const) {
    http.routes.set(`GET /api/employees/${id}`, () => ({ status: 200, data: employee(id, owner) }))
    http.routes.set(`PUT /api/employees/${id}/permissions`, () => ({
      status: 200,
      data: {
        employee_id: id,
        occupation_ids: [],
        effective_permissions: managerAccess,
        permission_overrides: {},
      },
    }))
  }
  http.routes.set('GET /api/employees/form', () => ({
    status: 200,
    data: { definition, hash: 'form-hash' },
  }))
}

let wrapper: VueWrapper | undefined

async function openEmployee(id: string): Promise<VueWrapper> {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/employees/:id/details', name: 'employee-detail', component: EmployeeDetailView },
      { path: '/employees', name: 'employees', component: EmployeeDetailView },
    ],
  })
  await router.push(`/employees/${id}/details`)
  await router.isReady()
  wrapper = mountWithApp(EmployeeDetailView, {
    global: { plugins: [router], stubs: { FormView: true, FormEdit: true, teleport: true } },
  })
  await flushPromises()
  return wrapper
}

function button(w: { findAll(selector: string): DOMWrapper<Element>[] }, label: string) {
  return w.findAll('button').find((b) => b.text() === label)
}

beforeEach(() => {
  sessionStorage.clear()
  http.routes.clear()
  http.requests.length = 0
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  localStorage.clear()
})

describe('EmployeeDetailView access settings', () => {
  // WP2: the owner holds every permission; nobody may change them.
  test("shows the owner's permissions read-only to a permission manager", async () => {
    signInAsDirector()
    const w = await openEmployee(OWNER_ID)

    expect(w.find('.employee-detail-access').text()).toContain(en.employees.owner_note)
    expect(button(w, en.employees.manage_occupations_action)).toBeUndefined()
    expect(button(w, en.employees.manage_permissions_action)).toBeUndefined()

    await button(w, en.employees.view_permissions_action)!.trigger('click')

    const dialog = w.find('.manage-permissions-dialog')
    expect(dialog.text()).toContain(en.employees.owner_note)
    expect(dialog.findAll('select').every((s) => s.attributes('disabled') !== undefined)).toBe(true)
    expect(dialog.findAll('button').map((b) => b.text())).toEqual([en.common.close])
  })

  test('lets a permission manager manage another employee', async () => {
    signInAsDirector()
    const w = await openEmployee(DIRECTOR_ID)

    expect(w.find('.employee-detail-access').text()).not.toContain(en.employees.owner_note)
    expect(button(w, en.employees.manage_occupations_action)).toBeDefined()
    expect(button(w, en.employees.manage_permissions_action)).toBeDefined()
  })

  // The access token carries no employee id; the account names the caller's employee.
  test('reloads the account after a change of the own permissions', async () => {
    signInAsDirector()
    const w = await openEmployee(DIRECTOR_ID)
    const accountLoads = () => http.requests.filter((r) => r === 'GET /api/account').length
    const before = accountLoads()

    await button(w, en.employees.manage_permissions_action)!.trigger('click')
    await button(w.find('.manage-permissions-dialog'), en.common.save)!.trigger('click')
    await flushPromises()

    expect(accountLoads()).toBeGreaterThan(before)
  })
})
