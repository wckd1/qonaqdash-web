import { afterEach, describe, expect, test } from 'vitest'
import type { VueWrapper } from '@vue/test-utils'
import { mountWithApp } from '@/test-utils/mount'
import PermissionMatrix from '@/features/employees/components/PermissionMatrix.vue'
import en from '@/locales/en.json'

let wrapper: VueWrapper | undefined

afterEach(() => {
  wrapper?.unmount()
  localStorage.clear()
})

/** Level labels offered for one permission row. */
function levelsOf(w: VueWrapper, actionLabel: string): string[] {
  const row = w.findAll('.permission-matrix__row').find((r) => r.text().includes(actionLabel))
  if (!row) throw new Error(`No row "${actionLabel}"`)
  return row.findAll('option').map((o) => o.text())
}

describe('PermissionMatrix', () => {
  // WP2 B17: nobody grants a level above their own for that permission.
  test("offers each permission up to the caller's own level of it", () => {
    // The caller manages permissions at hotel level, may view bookings but not create them.
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ hotel: { manage_permissions: 2 }, bookings: { view: 2 } }),
    )
    wrapper = mountWithApp(PermissionMatrix, {
      props: { modelValue: { bookings: { view: 2, create: 0 } } },
    })

    const level = en.permissions.level
    expect(levelsOf(wrapper, en.permissions.actions.bookings.view)).toEqual([
      level['0'],
      level['2'],
    ])
    expect(levelsOf(wrapper, en.permissions.actions.bookings.create)).toEqual([level['0']])
  })

  test('keeps a level the employee already has above the caller', () => {
    localStorage.setItem(
      'qonaqdash.account.permissions',
      JSON.stringify({ hotel: { manage_permissions: 2 }, bookings: { view: 2 } }),
    )
    wrapper = mountWithApp(PermissionMatrix, {
      props: { modelValue: { bookings: { view: 2, create: 2 } } },
    })

    const level = en.permissions.level
    expect(levelsOf(wrapper, en.permissions.actions.bookings.create)).toEqual([
      level['0'],
      level['2'],
    ])
  })
})
