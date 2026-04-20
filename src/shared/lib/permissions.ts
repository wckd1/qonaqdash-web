import type { Permissions, PermissionLevel } from '@/shared/types/permissions'

export type PermissionArea = keyof Permissions
export type PermissionAction =
  | 'view'
  | 'create'
  | 'operate'
  | 'modify'
  | 'cancel'
  | 'block'
  | 'collect_payment'
  | 'refund'
  | 'manage'
  | 'adjust'
  | 'manage_occupations'
  | 'manage_permissions'
  | 'delete'
  | 'assign'

export interface AccessContext {
  permissions: Permissions | null | undefined
  hasHotelContext: boolean
}

const PERMISSION_ACTIONS = {
  bookings: ['view', 'create', 'operate', 'modify', 'cancel'],
  guests: ['view', 'create', 'modify', 'block'],
  billing: ['view', 'collect_payment', 'modify', 'refund'],
  pricing: ['view', 'manage', 'adjust'],
  hotel: ['view', 'manage', 'manage_occupations', 'manage_permissions'],
  rooms: ['view', 'create', 'manage'],
  employees: ['view', 'manage', 'delete'],
  housekeeping_tasks: ['view', 'create', 'operate', 'assign'],
  maintenance_tasks: ['view', 'create', 'operate', 'assign'],
} as const satisfies Record<PermissionArea, readonly PermissionAction[]>

export const PERMISSION_AREA_ORDER = Object.keys(PERMISSION_ACTIONS) as PermissionArea[]

/**
 * Maps each action to its parent action within the same area.
 * `null` = root (always visible). If the parent's level is 0, the child is hidden and forced to 0.
 *
 * Hierarchy rationale:
 * - Most areas: `view` gates everything else (can't modify what you can't see).
 * - billing: `view` gates the rest; collect_payment / modify / refund are same-level siblings.
 * - employees: `view` → `manage` → `delete` (can't delete without manage access).
 */
export const PERMISSION_DEPENDENCIES: Record<string, Record<string, string | null>> = {
  bookings: { view: null, create: 'view', operate: 'view', modify: 'view', cancel: 'view' },
  guests: { view: null, create: 'view', modify: 'view', block: 'view' },
  billing: { view: null, collect_payment: 'view', modify: 'view', refund: 'view' },
  pricing: { view: null, manage: 'view', adjust: 'view' },
  hotel: { view: null, manage: 'view', manage_occupations: 'view', manage_permissions: 'view' },
  rooms: { view: null, create: 'view', manage: 'view' },
  employees: { view: null, manage: 'view', delete: 'manage' },
  housekeeping_tasks: { view: null, create: 'view', operate: 'view', assign: 'view' },
  maintenance_tasks: { view: null, create: 'view', operate: 'view', assign: 'view' },
}

/** Whether an action should be visible given current permission values. */
export function isActionVisible(
  permissions: Permissions | null | undefined,
  area: PermissionArea,
  action: PermissionAction,
): boolean {
  const deps = PERMISSION_DEPENDENCIES[area]
  if (!deps) return true
  const parent = deps[action]
  if (parent === null || parent === undefined) return true
  if (permissionLevel(permissions, area, parent as PermissionAction) === 0) return false
  return isActionVisible(permissions, area, parent as PermissionAction)
}

/** After setting an action to 0, zero-out all transitive dependents in-place and return the result. */
export function cascadePermissionReset(
  permissions: Permissions,
  area: PermissionArea,
  action: PermissionAction,
): Permissions {
  if (permissionLevel(permissions, area, action) > 0) return permissions
  const deps = PERMISSION_DEPENDENCIES[area]
  if (!deps) return permissions

  const section = (permissions[area] ?? {}) as Record<string, number | undefined>
  for (const [depAction, parent] of Object.entries(deps)) {
    if (parent === action && (section[depAction] === undefined || section[depAction] !== 0)) {
      section[depAction] = 0
      permissions[area] = section as Permissions[typeof area]
      permissions = cascadePermissionReset(permissions, area, depAction as PermissionAction)
    }
  }
  return permissions
}

export function permissionActionsFor(area: PermissionArea): readonly PermissionAction[] {
  return PERMISSION_ACTIONS[area]
}

export function normalizePermissionLevel(value: unknown): PermissionLevel | undefined {
  if (value === 0 || value === 1 || value === 2 || value === 3) return value
  return undefined
}

export function parsePermissions(raw: unknown): Permissions {
  const source = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const next: Permissions = {}

  for (const area of PERMISSION_AREA_ORDER) {
    const sectionRaw = source[area]
    if (!sectionRaw || typeof sectionRaw !== 'object') continue
    const sectionSource = sectionRaw as Record<string, unknown>
    const sectionTarget: Record<string, PermissionLevel> = {}

    for (const action of PERMISSION_ACTIONS[area]) {
      const level = normalizePermissionLevel(sectionSource[action])
      if (level !== undefined) sectionTarget[action] = level
    }

    if (Object.keys(sectionTarget).length > 0) {
      next[area] = sectionTarget as Permissions[typeof area]
    }
  }

  return next
}

export function extractPermissionsBundle(raw: unknown): Permissions | null {
  if (!raw || typeof raw !== 'object') return null
  const source = raw as Record<string, unknown>
  const candidates = [
    source.permissions,
    source.effective_permissions,
    source.account && typeof source.account === 'object'
      ? (source.account as Record<string, unknown>).permissions
      : null,
    source.account && typeof source.account === 'object'
      ? (source.account as Record<string, unknown>).effective_permissions
      : null,
    source.profile && typeof source.profile === 'object'
      ? (source.profile as Record<string, unknown>).permissions
      : null,
    source.profile && typeof source.profile === 'object'
      ? (source.profile as Record<string, unknown>).effective_permissions
      : null,
  ]

  for (const candidate of candidates) {
    const parsed = parsePermissions(candidate)
    if (Object.keys(parsed).length > 0) return parsed
  }

  return null
}

export function permissionsEqual(
  a: Permissions | null | undefined,
  b: Permissions | null | undefined,
): boolean {
  return JSON.stringify(a ?? {}) === JSON.stringify(b ?? {})
}

export function clonePermissions(value: Permissions | null | undefined): Permissions {
  return JSON.parse(JSON.stringify(value ?? {})) as Permissions
}

export function permissionLevel(
  permissions: Permissions | null | undefined,
  area: PermissionArea,
  action: PermissionAction,
): PermissionLevel {
  const section = permissions?.[area] as Record<string, PermissionLevel | undefined> | undefined
  return normalizePermissionLevel(section?.[action]) ?? 0
}

export function hasPermission(
  permissions: Permissions | null | undefined,
  area: PermissionArea,
  action: PermissionAction,
  minLevel: PermissionLevel = 1,
): boolean {
  return permissionLevel(permissions, area, action) >= minLevel
}

export function hasAnyPermission(
  permissions: Permissions | null | undefined,
  keys: readonly `${PermissionArea}.${PermissionAction}`[],
): boolean {
  return keys.some((key) => {
    const [area, action] = key.split('.') as [PermissionArea, PermissionAction]
    return hasPermission(permissions, area, action)
  })
}

export function canAccessDashboard(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasPermission(ctx.permissions, 'bookings', 'view') &&
    hasPermission(ctx.permissions, 'rooms', 'view')
  )
}

export function canViewBookings(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'bookings', 'view')
}

export function canCreateBookings(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'bookings', 'create')
}

export function canModifyBookings(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'bookings', 'modify')
}

export function canOperateBookings(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'bookings', 'operate')
}

export function canCancelBookings(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'bookings', 'cancel')
}

export function canAccessGuests(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'guests', 'view')
}

export function canCreateGuests(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'guests', 'create')
}

export function canModifyGuests(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'guests', 'modify')
}

export function canBlockGuests(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'guests', 'block')
}

export function canAccessEmployees(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'employees', 'view')
}

export function canManageEmployees(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'employees', 'manage')
}

export function canAccessHotelGeneral(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasAnyPermission(ctx.permissions, ['hotel.view', 'hotel.manage'])
}

export function canManageHotel(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'hotel', 'manage')
}

export function canManageOccupations(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'hotel', 'manage_occupations')
}

export function canManageEmployeePermissions(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'hotel', 'manage_permissions')
}

export function canAccessRooms(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasAnyPermission(ctx.permissions, ['rooms.view', 'rooms.create', 'rooms.manage'])
  )
}

export function canCreateRooms(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'rooms', 'create')
}

export function canManageRooms(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'rooms', 'manage')
}

export function canAccessPricingBaseRates(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasAnyPermission(ctx.permissions, ['pricing.view', 'pricing.adjust', 'pricing.manage'])
  )
}

export function canAccessPricingRules(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext && hasAnyPermission(ctx.permissions, ['pricing.view', 'pricing.manage'])
  )
}

export function canAdjustPricing(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'pricing', 'adjust')
}

export function canManagePricing(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'pricing', 'manage')
}

export function canAccessReports(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'billing', 'view')
}

export function canAccessBookingFolio(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasAnyPermission(ctx.permissions, [
      'billing.view',
      'billing.collect_payment',
      'billing.modify',
      'billing.refund',
    ])
  )
}

export function canCollectPayment(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'billing', 'collect_payment')
}

export function canModifyBilling(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'billing', 'modify')
}

export function canRefundBilling(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'billing', 'refund')
}

export function canManageGuestForms(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'guests', 'modify')
}

export function canManageBookingForms(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'hotel', 'manage')
}

export function canManageEmployeeForms(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'employees', 'manage')
}

export function canAccessFormsOverview(ctx: AccessContext): boolean {
  return canManageGuestForms(ctx) || canManageBookingForms(ctx) || canManageEmployeeForms(ctx)
}

export function canAccessHousekeepingTasks(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasAnyPermission(ctx.permissions, [
      'housekeeping_tasks.view',
      'housekeeping_tasks.create',
      'housekeeping_tasks.operate',
      'housekeeping_tasks.assign',
    ])
  )
}

export function canCreateHousekeepingTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'housekeeping_tasks', 'create')
}

export function canOperateHousekeepingTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'housekeeping_tasks', 'operate')
}

export function canAssignHousekeepingTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'housekeeping_tasks', 'assign')
}

export function canAccessMaintenanceTasks(ctx: AccessContext): boolean {
  return (
    ctx.hasHotelContext &&
    hasAnyPermission(ctx.permissions, [
      'maintenance_tasks.view',
      'maintenance_tasks.create',
      'maintenance_tasks.operate',
      'maintenance_tasks.assign',
    ])
  )
}

export function canCreateMaintenanceTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'maintenance_tasks', 'create')
}

export function canOperateMaintenanceTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'maintenance_tasks', 'operate')
}

export function canAssignMaintenanceTasks(ctx: AccessContext): boolean {
  return ctx.hasHotelContext && hasPermission(ctx.permissions, 'maintenance_tasks', 'assign')
}

export function resolveAccessibleHomeRoute(ctx: AccessContext): string {
  if (canAccessDashboard(ctx)) return 'dashboard'
  if (canViewBookings(ctx)) return 'bookings'
  if (canAccessGuests(ctx)) return 'guests'
  if (canAccessHousekeepingTasks(ctx)) return 'housekeeping'
  if (canAccessMaintenanceTasks(ctx)) return 'maintenance'
  if (canAccessEmployees(ctx)) return 'employees'
  if (canAccessHotelGeneral(ctx)) return 'manage-hotel'
  if (canAccessRooms(ctx)) return 'rooms'
  if (canManageOccupations(ctx)) return 'manage-hotel-occupations'
  if (canAccessPricingBaseRates(ctx)) return 'manage-pricing-base-rates'
  if (canAccessPricingRules(ctx)) return 'manage-pricing-rules'
  if (canAccessFormsOverview(ctx)) return 'manage-forms'
  if (canAccessReports(ctx)) return 'manage-reports'
  return 'profile'
}
