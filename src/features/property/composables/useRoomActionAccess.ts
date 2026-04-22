import { computed } from 'vue'
import { usePermissions } from '@/shared/composables/usePermissions'
import type { RoomHousekeepingStatus, RoomMaintenanceStatus } from '@/shared/types/property'

/**
 * Maps task permissions to the subset of room-axis statuses the actor may set.
 * - housekeeping_tasks.create → 'dirty' (can flag a room as needing cleaning).
 * - housekeeping_tasks.operate → 'cleaning' | 'inspection' | 'clean' (can perform / complete).
 * - maintenance_tasks.create → 'required' (can flag a room as needing maintenance).
 * - maintenance_tasks.operate → 'none' | 'under_maintenance' (can start / finish maintenance).
 *
 * Booking operators additionally get the two "flag needs attention" transitions
 * ('dirty', 'required') so they can triage rooms during a stay / after checkout
 * without holding the full task-create role.
 */
export function useRoomActionAccess() {
  const {
    canCreateHousekeepingTasks,
    canOperateHousekeepingTasks,
    canCreateMaintenanceTasks,
    canOperateMaintenanceTasks,
    canOperateBookings,
  } = usePermissions()

  const cleaningStatuses = computed<RoomHousekeepingStatus[]>(() => {
    const out: RoomHousekeepingStatus[] = []
    if (canCreateHousekeepingTasks.value || canOperateBookings.value) out.push('dirty')
    if (canOperateHousekeepingTasks.value) out.push('cleaning', 'inspection', 'clean')
    return out
  })

  const maintenanceStatuses = computed<RoomMaintenanceStatus[]>(() => {
    const out: RoomMaintenanceStatus[] = []
    if (canCreateMaintenanceTasks.value || canOperateBookings.value) out.push('required')
    if (canOperateMaintenanceTasks.value) out.push('none', 'under_maintenance')
    return out
  })

  const canCleaning = computed(() => cleaningStatuses.value.length > 0)
  const canMaintenance = computed(() => maintenanceStatuses.value.length > 0)

  return { cleaningStatuses, maintenanceStatuses, canCleaning, canMaintenance }
}
