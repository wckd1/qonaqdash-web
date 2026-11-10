import type { APIRequestContext, Page } from '@playwright/test'
import { seedUser, type SeedUser } from './fixtures/seed-users'
import { en, expect, login, test } from './fixtures/test'

// Each test signs in as its own user.
test.use({ storageState: { cookies: [], origins: [] } })

/** Collects every API response with an error status while the test runs. */
function watchApiErrors(page: Page): string[] {
  const errors: string[] = []
  page.on('response', (r) => {
    const url = new URL(r.url())
    if (url.pathname.startsWith('/api/') && r.status() >= 400) {
      errors.push(`${r.status()} ${r.request().method()} ${url.pathname}`)
    }
  })
  return errors
}

/** Bearer headers of a user signed in through the API, without the UI. */
async function apiSession(request: APIRequestContext, user: SeedUser) {
  const res = await request.post('/api/auth/login', {
    data: { email: user.email, password: user.password },
  })
  expect(res.ok()).toBe(true)
  const { access_token: token } = (await res.json()) as { access_token: string }
  return { Authorization: `Bearer ${token}` }
}

async function accountName(page: Page): Promise<string> {
  const token = await page.evaluate(() => localStorage.getItem('access_token'))
  const account = (await (
    await page.request.get('/api/account', { headers: { Authorization: `Bearer ${token}` } })
  ).json()) as { profile: { first_name: string; last_name: string } }
  return `${account.profile.first_name} ${account.profile.last_name}`
}

// WP2 B26: housekeeping and maintenance staff work only on their own tasks.
for (const [role, domain] of [
  ['housekeeper', 'housekeeping'],
  ['technician', 'maintenance'],
] as const) {
  test(`${role} sees only the tasks tab and only own tasks, without access errors`, async ({
    page,
  }) => {
    const errors = watchApiErrors(page)
    await login(page, seedUser(role))

    await expect(page).toHaveURL(new RegExp(`/tasks/${domain}$`))
    const nav = page.locator('aside.sidebar nav a')
    await expect(nav).toHaveText([en.nav.tasks])

    const rows = page.locator('table.list-table tbody tr')
    await expect(rows.first()).toBeVisible()
    const name = await accountName(page)
    // Column 4 is the assignee; the room number comes with each task.
    await expect(rows.locator('td:nth-child(4)')).toHaveText(
      Array.from({ length: await rows.count() }, () => name),
    )
    await expect(rows.first().locator('td').first()).not.toHaveText('')

    await page.goto('/bookings')
    await expect(page).toHaveURL(/\/forbidden/)
    await expect(page.locator('main.app-main')).toContainText(en.forbidden.message)
    expect(errors).toEqual([])
  })
}

const SUPERVISOR = {
  role: 'housekeeping supervisor (e2e)',
  email: 'e2e-supervisor@example.test',
  password: 'supervisor12345',
}

/**
 * A housekeeping supervisor of Qonaq City Hotel: may create and assign
 * housekeeping tasks, but has no employee rights. Created through the owner
 * once and reused by later runs.
 */
async function ensureSupervisor(request: APIRequestContext): Promise<void> {
  const login = await request.post('/api/auth/login', {
    data: { email: SUPERVISOR.email, password: SUPERVISOR.password },
  })
  if (login.ok()) return
  const headers = await apiSession(request, seedUser('owner'))
  const created = await request.post('/api/employees', {
    headers,
    data: { first_name: 'Sabina', last_name: 'Supervisor', email: SUPERVISOR.email },
  })
  expect(created.status()).toBe(201)
  const { employee, invite_token: inviteToken } = (await created.json()) as {
    employee: { id: string }
    invite_token: string
  }
  const groups = (await (await request.get('/api/occupations', { headers })).json()) as {
    occupations: { id: string; title: string }[]
  }[]
  const template = groups
    .flatMap((g) => g.occupations)
    .find((o) => o.title === 'iam.occupations.housekeeping_supervisor')
  if (!template) throw new Error('No housekeeping supervisor occupation template')
  const assigned = await request.put(`/api/employees/${employee.id}/occupations`, {
    headers,
    data: { occupation_ids: [template.id] },
  })
  expect(assigned.ok()).toBe(true)
  const registered = await request.post(`/api/auth/invite/${inviteToken}`, {
    data: { password: SUPERVISOR.password },
  })
  expect(registered.ok()).toBe(true)
}

// WP2 B23: a supervisor assigns tasks without the right to the staff list.
test('supervisor assigns a housekeeping task without employee rights', async ({ page }) => {
  await ensureSupervisor(page.request)
  const owner = await apiSession(page.request, seedUser('owner'))
  const tasks = (await (
    await page.request.get('/api/tasks/housekeeping', { headers: owner })
  ).json()) as { room_id: string; status: string }[]
  const busy = new Set(
    tasks.filter((t) => t.status !== 'done' && t.status !== 'canceled').map((t) => t.room_id),
  )
  const rooms = (await (
    await page.request.get('/api/property/rooms/available', { headers: owner })
  ).json()) as { id: string; number: string }[]
  const room = rooms.find((r) => !busy.has(r.id))
  if (!room) throw new Error('Every room has an open housekeeping task')
  const housekeeper = (
    (await (
      await page.request.get('/api/tasks/assignees', {
        headers: owner,
        params: { type: 'housekeeping' },
      })
    ).json()) as { id: string; name: string }[]
  ).find((a) => a.name.includes('Housekeeper'))
  if (!housekeeper) throw new Error('No housekeeper among the assignee candidates')

  const errors = watchApiErrors(page)
  let taskId: string | undefined
  try {
    await login(page, SUPERVISOR)
    await page.goto('/tasks/housekeeping')
    await page.getByRole('button', { name: en.tasks.create_aria }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByLabel(en.fields.room_number).selectOption({ label: room.number })
    await dialog.getByLabel(en.tasks.col_assignee).selectOption({ label: housekeeper.name })
    const created = page.waitForResponse(
      (r) =>
        r.request().method() === 'POST' && new URL(r.url()).pathname === '/api/tasks/housekeeping',
    )
    await dialog.getByRole('button', { name: en.common.add, exact: true }).click()
    const response = await created
    expect(response.status()).toBe(201)
    const task = (await response.json()) as { id: string; assignee_employee_id?: string }
    taskId = task.id
    expect(task.assignee_employee_id).toBe(housekeeper.id)

    const row = page.locator('table.list-table tbody tr', { hasText: room.number })
    await expect(row.locator('td:nth-child(4)')).toHaveText(housekeeper.name)
    expect(errors).toEqual([])
  } finally {
    if (taskId) {
      await page.request.put(`/api/tasks/housekeeping/${taskId}/status`, {
        headers: owner,
        data: { status: 'canceled' },
      })
    }
  }
})

// WP2 B28: the reservation grid has its rows for a booking reader without rooms.view.
test('receptionist sees the reservation grid without access errors', async ({ page }) => {
  const errors = watchApiErrors(page)
  await login(page, seedUser('reception'))

  await expect(page.getByRole('heading', { level: 1, name: en.dashboard.title })).toBeVisible()
  await expect(page.locator('.reservation-grid-label-num').first()).toBeVisible()
  await expect(page.locator('.dashboard-view .error-message')).toHaveCount(0)
  expect(errors).toEqual([])
})
