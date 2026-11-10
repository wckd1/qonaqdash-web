import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { makeToken } from '@/test-utils/jwt'
import type { FakeRoute } from '@/test-utils/fakeApi'

const http = vi.hoisted(() => {
  const requests: string[] = []
  /** Routes that also record every request looked up, answered or not. */
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

const { default: TaskBoardView } = await import('@/features/tasks/views/TaskBoardView.vue')

const task = {
  id: 'task-1',
  room_id: 'room-203',
  room_number: '203',
  status: 'open',
  source: 'manual',
  description: 'Towels',
  assignee_employee_id: 'employee-anna',
  assignee_name: 'Anna Housekeeper',
  created_at: '2026-11-10T10:00:00Z',
  updated_at: '2026-11-10T10:00:00Z',
  created_by_employee_id: 'employee-boss',
  updated_by_employee_id: 'employee-boss',
}

/** Signed in to a hotel with the given housekeeping task permissions. */
function signIn(housekeeping: Record<string, number>) {
  localStorage.setItem('access_token', makeToken('access', 3600))
  localStorage.setItem(
    'qonaqdash.account.permissions',
    JSON.stringify({ housekeeping_tasks: housekeeping }),
  )
}

let wrapper: VueWrapper | undefined

async function openBoard(): Promise<VueWrapper> {
  wrapper = mountWithApp(TaskBoardView, { props: { domain: 'housekeeping' } })
  await flushPromises()
  return wrapper
}

function requested(path: string): boolean {
  return http.requests.some((r) => r.split(' ')[1] === path)
}

beforeEach(() => {
  http.routes.clear()
  http.requests.length = 0
  http.routes.set('GET /api/tasks/housekeeping', () => ({ status: 200, data: [task] }))
})

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  localStorage.clear()
})

describe('TaskBoardView', () => {
  // Principle 5: the room number comes with the task; a housekeeper has no rooms.view.
  test('shows the room number of the task without loading the rooms', async () => {
    signIn({ view: 1, operate: 1 })
    const w = await openBoard()

    expect(w.find('tbody tr').text()).toContain('203')
    expect(requested('/api/property/rooms')).toBe(false)
  })

  test('offers the hotel rooms for a new task', async () => {
    signIn({ view: 2, create: 2 })
    http.routes.set('GET /api/property/rooms/available', () => ({
      status: 200,
      data: [
        {
          id: 'room-101',
          number: '101',
          room_type_id: 'type-1',
          room_type_name: 'Standard',
          state: 'selectable',
        },
      ],
    }))
    const w = await openBoard()

    await w.find('button.btn-add-outline').trigger('click')

    const options = w.findAll('[role="dialog"] select option').map((o) => o.text())
    expect(options).toContain('101')
    expect(requested('/api/property/rooms')).toBe(false)
  })
})
