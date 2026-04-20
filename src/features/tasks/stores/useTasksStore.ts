import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as tasksApi from '@/features/tasks/api'
import type {
  ChangeHousekeepingStatusRequest,
  ChangeMaintenanceStatusRequest,
  CreateHousekeepingTaskRequest,
  CreateMaintenanceTaskRequest,
  HousekeepingTask,
  ListTasksQuery,
  MaintenanceTask,
  UpdateHousekeepingTaskRequest,
  UpdateMaintenanceTaskRequest,
} from '@/shared/types/tasks'

export const useTasksStore = defineStore('tasks', () => {
  const housekeeping = ref<HousekeepingTask[]>([])
  const maintenance = ref<MaintenanceTask[]>([])

  function replaceIn<T extends { id: string }>(list: T[], updated: T): T[] {
    const next = list.map((t) => (t.id === updated.id ? updated : t))
    if (!next.some((t) => t.id === updated.id)) next.unshift(updated)
    return next
  }

  // Housekeeping -----------------------------------------------------------

  async function fetchHousekeeping(query: ListTasksQuery = {}): Promise<HousekeepingTask[]> {
    const list = await tasksApi.fetchHousekeepingTasks(query)
    housekeeping.value = list
    return list
  }

  async function createHousekeeping(
    body: CreateHousekeepingTaskRequest,
  ): Promise<HousekeepingTask> {
    const created = await tasksApi.createHousekeepingTask(body)
    housekeeping.value = [created, ...housekeeping.value]
    return created
  }

  async function updateHousekeeping(
    id: string,
    body: UpdateHousekeepingTaskRequest,
  ): Promise<HousekeepingTask> {
    const updated = await tasksApi.updateHousekeepingTask(id, body)
    housekeeping.value = replaceIn(housekeeping.value, updated)
    return updated
  }

  async function changeHousekeepingStatus(
    id: string,
    body: ChangeHousekeepingStatusRequest,
  ): Promise<HousekeepingTask> {
    const updated = await tasksApi.changeHousekeepingStatus(id, body)
    housekeeping.value = replaceIn(housekeeping.value, updated)
    return updated
  }

  // Maintenance ------------------------------------------------------------

  async function fetchMaintenance(query: ListTasksQuery = {}): Promise<MaintenanceTask[]> {
    const list = await tasksApi.fetchMaintenanceTasks(query)
    maintenance.value = list
    return list
  }

  async function createMaintenance(body: CreateMaintenanceTaskRequest): Promise<MaintenanceTask> {
    const created = await tasksApi.createMaintenanceTask(body)
    maintenance.value = [created, ...maintenance.value]
    return created
  }

  async function updateMaintenance(
    id: string,
    body: UpdateMaintenanceTaskRequest,
  ): Promise<MaintenanceTask> {
    const updated = await tasksApi.updateMaintenanceTask(id, body)
    maintenance.value = replaceIn(maintenance.value, updated)
    return updated
  }

  async function changeMaintenanceStatus(
    id: string,
    body: ChangeMaintenanceStatusRequest,
  ): Promise<MaintenanceTask> {
    const updated = await tasksApi.changeMaintenanceStatus(id, body)
    maintenance.value = replaceIn(maintenance.value, updated)
    return updated
  }

  function resetState() {
    housekeeping.value = []
    maintenance.value = []
  }

  return {
    housekeeping,
    maintenance,
    fetchHousekeeping,
    createHousekeeping,
    updateHousekeeping,
    changeHousekeepingStatus,
    fetchMaintenance,
    createMaintenance,
    updateMaintenance,
    changeMaintenanceStatus,
    resetState,
  }
})
