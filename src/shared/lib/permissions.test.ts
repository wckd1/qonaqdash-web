import { describe, expect, test } from 'vitest'
import {
  canAccessDashboard,
  canAccessRooms,
  canViewBookings,
  cascadePermissionReset,
  extractPermissionsBundle,
  hasAnyPermission,
  hasPermission,
  isActionVisible,
  normalizePermissionLevel,
  parsePermissions,
  permissionLevel,
  resolveAccessibleHomeRoute,
  type AccessContext,
} from '@/shared/lib/permissions'
import type { Permissions } from '@/shared/types/permissions'

function ctx(permissions: Permissions | null, hasHotelContext = true): AccessContext {
  return { permissions, hasHotelContext }
}

describe('permission levels', () => {
  test('normalizePermissionLevel accepts only 0..3', () => {
    expect(normalizePermissionLevel(0)).toBe(0)
    expect(normalizePermissionLevel(3)).toBe(3)
    expect(normalizePermissionLevel(4)).toBeUndefined()
    expect(normalizePermissionLevel('2')).toBeUndefined()
    expect(normalizePermissionLevel(null)).toBeUndefined()
  })

  test('permissionLevel is 0 for missing areas, actions and bundles', () => {
    expect(permissionLevel(null, 'bookings', 'view')).toBe(0)
    expect(permissionLevel({}, 'bookings', 'view')).toBe(0)
    expect(permissionLevel({ bookings: { create: 2 } }, 'bookings', 'view')).toBe(0)
    expect(permissionLevel({ bookings: { view: 2 } }, 'bookings', 'view')).toBe(2)
  })

  test('hasPermission compares with the minimum level, 1 by default', () => {
    const permissions: Permissions = { bookings: { view: 1, modify: 2 } }

    expect(hasPermission(permissions, 'bookings', 'view')).toBe(true)
    expect(hasPermission(permissions, 'bookings', 'view', 2)).toBe(false)
    expect(hasPermission(permissions, 'bookings', 'modify', 2)).toBe(true)
    expect(hasPermission(permissions, 'bookings', 'cancel')).toBe(false)
    expect(hasPermission({ bookings: { view: 0 } }, 'bookings', 'view')).toBe(false)
  })

  test('hasAnyPermission is true when one of the keys is granted', () => {
    const permissions: Permissions = { rooms: { manage: 1 } }

    expect(hasAnyPermission(permissions, ['rooms.view', 'rooms.manage'])).toBe(true)
    expect(hasAnyPermission(permissions, ['rooms.view', 'rooms.create'])).toBe(false)
    expect(hasAnyPermission(permissions, [])).toBe(false)
  })
})

describe('parsing', () => {
  test('parsePermissions keeps known areas and actions with valid levels', () => {
    const parsed = parsePermissions({
      bookings: { view: 1, create: 2, unknown_action: 3, cancel: 7 },
      unknown_area: { view: 1 },
      guests: { view: 'yes' },
      rooms: null,
    })

    expect(parsed).toEqual({ bookings: { view: 1, create: 2 } })
  })

  test('parsePermissions returns an empty bundle for non-objects', () => {
    expect(parsePermissions(null)).toEqual({})
    expect(parsePermissions('bookings')).toEqual({})
  })

  test('extractPermissionsBundle reads the first non-empty candidate', () => {
    expect(extractPermissionsBundle({ permissions: { guests: { view: 1 } } })).toEqual({
      guests: { view: 1 },
    })
    expect(
      extractPermissionsBundle({
        permissions: {},
        effective_permissions: { rooms: { view: 2 } },
      }),
    ).toEqual({ rooms: { view: 2 } })
    expect(extractPermissionsBundle({ account: { permissions: { hotel: { view: 1 } } } })).toEqual({
      hotel: { view: 1 },
    })
  })

  test('extractPermissionsBundle returns null when nothing is granted', () => {
    expect(extractPermissionsBundle(null)).toBeNull()
    expect(extractPermissionsBundle({ permissions: {} })).toBeNull()
  })
})

describe('action dependencies', () => {
  test('an action is hidden when its parent action is 0', () => {
    expect(isActionVisible({ bookings: { view: 0 } }, 'bookings', 'create')).toBe(false)
    expect(isActionVisible({ bookings: { view: 1 } }, 'bookings', 'create')).toBe(true)
    expect(isActionVisible({}, 'bookings', 'view')).toBe(true)
  })

  test('visibility follows the whole chain', () => {
    // employees: view -> manage -> delete
    expect(isActionVisible({ employees: { view: 1, manage: 0 } }, 'employees', 'delete')).toBe(
      false,
    )
    expect(isActionVisible({ employees: { view: 0, manage: 1 } }, 'employees', 'delete')).toBe(
      false,
    )
    expect(isActionVisible({ employees: { view: 1, manage: 1 } }, 'employees', 'delete')).toBe(true)
  })

  test('cascadePermissionReset zeroes transitive dependents of a revoked action', () => {
    const permissions: Permissions = { employees: { view: 0, manage: 2, delete: 1 } }

    expect(cascadePermissionReset(permissions, 'employees', 'view')).toEqual({
      employees: { view: 0, manage: 0, delete: 0 },
    })
  })

  test('cascadePermissionReset leaves dependents of a granted action alone', () => {
    const permissions: Permissions = { employees: { view: 1, manage: 2, delete: 1 } }

    expect(cascadePermissionReset(permissions, 'employees', 'view')).toEqual({
      employees: { view: 1, manage: 2, delete: 1 },
    })
  })
})

describe('route access', () => {
  test('operational screens need a hotel in the session', () => {
    const permissions: Permissions = { bookings: { view: 1 }, rooms: { view: 1 } }

    expect(canAccessDashboard(ctx(permissions))).toBe(true)
    expect(canAccessDashboard(ctx(permissions, false))).toBe(false)
    expect(canViewBookings(ctx(permissions, false))).toBe(false)
  })

  test('dashboard needs both bookings and rooms', () => {
    expect(canAccessDashboard(ctx({ bookings: { view: 1 } }))).toBe(false)
    expect(canAccessDashboard(ctx({ rooms: { view: 1 } }))).toBe(false)
  })

  test('rooms open with any rooms permission', () => {
    expect(canAccessRooms(ctx({ rooms: { create: 1 } }))).toBe(true)
    expect(canAccessRooms(ctx({ rooms: { view: 0 } }))).toBe(false)
  })

  test.each<[string, Permissions | null, boolean, string]>([
    ['full access', { bookings: { view: 1 }, rooms: { view: 1 } }, true, 'dashboard'],
    ['bookings without rooms', { bookings: { view: 1 } }, true, 'bookings'],
    ['guests only', { guests: { view: 1 } }, true, 'guests'],
    ['housekeeping only', { housekeeping_tasks: { operate: 1 } }, true, 'housekeeping'],
    ['maintenance only', { maintenance_tasks: { view: 1 } }, true, 'maintenance'],
    ['reports only', { billing: { view: 1 } }, true, 'manage-reports'],
    ['no hotel in session', { bookings: { view: 1 }, rooms: { view: 1 } }, false, 'profile'],
    ['no permissions', null, true, 'profile'],
  ])('home route for %s', (_, permissions, hasHotelContext, expected) => {
    expect(resolveAccessibleHomeRoute(ctx(permissions, hasHotelContext))).toBe(expected)
  })
})
