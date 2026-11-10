import { afterEach, describe, expect, test, vi } from 'vitest'
import { flushPromises, type VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import { apiError, type FakeRoute } from '@/test-utils/fakeApi'
import en from '@/locales/en.json'

const http = vi.hoisted(() => ({ routes: new Map<string, FakeRoute>() }))

vi.mock('@/shared/api/client', async () => {
  const { createFakeApi } = await import('@/test-utils/fakeApi')
  const api = createFakeApi(http.routes)
  return { default: api, refreshTransport: api }
})

const { default: ManagePermissionsDialog } =
  await import('@/features/employees/components/ManagePermissionsDialog.vue')

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  wrapper = undefined
  http.routes.clear()
})

describe('ManagePermissionsDialog', () => {
  // WP2 B17: the server refuses granting above the caller's own levels.
  test('shows which permissions cannot be granted and stays open', async () => {
    http.routes.set('PUT /api/employees/employee-1/permissions', () =>
      apiError(403, 'iam.permission_escalation', 'permission escalation', {
        fields: ['billing.refund'],
      }),
    )
    wrapper = mountWithApp(ManagePermissionsDialog, {
      props: {
        employeeId: 'employee-1',
        initialPermissions: { billing: { view: 2 } },
        initialOverrides: { billing: { refund: 2 } },
      },
      global: { stubs: { teleport: true } },
    })

    const save = wrapper.findAll('button').find((b) => b.text() === en.common.save)
    await save!.trigger('click')
    await flushPromises()

    expect(wrapper.find('[role="alert"]').text()).toBe(
      'You cannot grant permissions above your own: Billing: Record refunds',
    )
    expect(wrapper.emitted('saved')).toBeUndefined()
  })
})
