export type PermissionLevel = 0 | 1 | 2 | 3

export interface BookingsPermissions {
  view?: PermissionLevel
  create?: PermissionLevel
  operate?: PermissionLevel
  modify?: PermissionLevel
  cancel?: PermissionLevel
}

export interface GuestsPermissions {
  view?: PermissionLevel
  create?: PermissionLevel
  modify?: PermissionLevel
  block?: PermissionLevel
}

export interface BillingPermissions {
  view?: PermissionLevel
  collect_payment?: PermissionLevel
  modify?: PermissionLevel
  refund?: PermissionLevel
}

export interface PricingPermissions {
  view?: PermissionLevel
  manage?: PermissionLevel
  adjust?: PermissionLevel
}

export interface HotelPermissions {
  view?: PermissionLevel
  manage?: PermissionLevel
  manage_occupations?: PermissionLevel
  manage_permissions?: PermissionLevel
}

export interface RoomsPermissions {
  view?: PermissionLevel
  create?: PermissionLevel
  manage?: PermissionLevel
}

export interface EmployeesPermissions {
  view?: PermissionLevel
  manage?: PermissionLevel
  delete?: PermissionLevel
}

export interface Permissions {
  bookings?: BookingsPermissions
  guests?: GuestsPermissions
  billing?: BillingPermissions
  pricing?: PricingPermissions
  hotel?: HotelPermissions
  rooms?: RoomsPermissions
  employees?: EmployeesPermissions
}

export interface OccupationTemplate {
  id: string
  title: string
  role_key: string
  role_title: string
  permissions: Permissions
}

export interface OccupationRoleGroup {
  role_key: string
  role_title: string
  occupations: OccupationTemplate[]
}

export interface EmployeeOccupationsResponse {
  employee_id: string
  occupation_ids: string[]
  occupations: OccupationTemplate[]
}

export interface EmployeePermissionsResponse {
  employee_id: string
  occupation_ids: string[]
  occupation_templates: OccupationTemplate[]
  permission_overrides: Permissions
  effective_permissions: Permissions
}
