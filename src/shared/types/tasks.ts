/** Housekeeping / maintenance task shapes.
 *
 * The backend splits the two domains into separate aggregates with distinct
 * endpoints, DTOs, and status lifecycles; there is no unified "task" type.
 */

export type TaskDomain = 'housekeeping' | 'maintenance'

export type TaskSource = 'manual' | 'auto_checkout'

export type HousekeepingTaskStatus = 'open' | 'in_progress' | 'inspection' | 'done' | 'cancelled'

export type MaintenanceTaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled'

export type TaskStatus = HousekeepingTaskStatus | MaintenanceTaskStatus

interface TaskBase {
  id: string
  room_id: string
  description?: string
  assignee_employee_id?: string | null
  source?: TaskSource
  created_by_employee_id?: string
  updated_by_employee_id?: string
  created_at?: string
  updated_at?: string
  completed_at?: string | null
  cancelled_at?: string | null
}

export interface HousekeepingTask extends TaskBase {
  status: HousekeepingTaskStatus
  booking_id?: string | null
}

export interface MaintenanceTask extends TaskBase {
  status: MaintenanceTaskStatus
  planned_end?: string | null
}

export interface CreateHousekeepingTaskRequest {
  room_id: string
  description?: string
  assignee_employee_id?: string | null
}

export interface CreateMaintenanceTaskRequest {
  room_id: string
  description?: string
  /** RFC 3339. Required. */
  planned_end: string
  assignee_employee_id?: string | null
}

export interface UpdateHousekeepingTaskRequest {
  description?: string
  assignee_employee_id?: string | null
}

export interface UpdateMaintenanceTaskRequest {
  description?: string
  planned_end?: string | null
  assignee_employee_id?: string | null
}

export interface ChangeHousekeepingStatusRequest {
  status: Exclude<HousekeepingTaskStatus, 'open'>
}

export interface ChangeMaintenanceStatusRequest {
  status: Exclude<MaintenanceTaskStatus, 'open'>
}

export interface ListTasksQuery {
  status?: TaskStatus
  room_id?: string
  assignee?: string
  unassigned?: boolean
}
