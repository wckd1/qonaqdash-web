/** Property / rooms REST shapes (shared across features and FormDSL inject). */

export interface Hotel {
  id: string
  name: string
  /** ISO 4217 alpha-3 (e.g. `KZT`). */
  currency: string
  /** Default check-in time, e.g. `"14:00"`. */
  check_in_hour: string
  /** Default check-out time, e.g. `"12:00"`. */
  check_out_hour: string
}

export interface RoomType {
  id: string
  name: string
  description?: string
}

export type RoomAvailabilityStatus = 'available' | 'ooo'

export type RoomHousekeepingStatus = 'dirty' | 'cleaning' | 'inspection' | 'clean'

export type RoomMaintenanceStatus = 'none' | 'required' | 'under_maintenance'

export interface Room {
  id: string
  number: string
  room_type_id: string
  room_type_name?: string
  /** Three independent operational axes (Stage 3). */
  availability_status?: RoomAvailabilityStatus
  housekeeping_status?: RoomHousekeepingStatus
  maintenance_status?: RoomMaintenanceStatus
  /** RFC 3339; required when `maintenance_status = under_maintenance`. */
  maintenance_planned_end?: string | null
  /** Event-sourced aggregate version (informational). */
  version?: number
}

export type AvailableRoomState =
  | 'selectable'
  | 'selectable_with_warning'
  | 'blocked_by_inventory'
  | 'blocked_by_maintenance'
  | 'blocked_by_occupancy'

export interface AvailableRoom {
  id: string
  number: string
  room_type_id: string
  room_type_name?: string
  state: AvailableRoomState
  warnings: string[]
}

export type RoomActivityEventType =
  | 'RoomAvailabilityChanged'
  | 'RoomHousekeepingChanged'
  | 'RoomMaintenanceChanged'
  | 'RoomMaintenancePlannedEndChanged'
  | string

export interface RoomActivityEntry {
  event_id: string
  event_type: RoomActivityEventType
  version: number
  payload: Record<string, unknown>
  metadata: Record<string, unknown> & { employee_id?: string }
  occurred_at: string
}
