import api from '@/shared/api/client'
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

export type {
  HousekeepingTask,
  MaintenanceTask,
  CreateHousekeepingTaskRequest,
  CreateMaintenanceTaskRequest,
  UpdateHousekeepingTaskRequest,
  UpdateMaintenanceTaskRequest,
  ChangeHousekeepingStatusRequest,
  ChangeMaintenanceStatusRequest,
} from '@/shared/types/tasks'

function buildListParams(query: ListTasksQuery): Record<string, string | boolean> {
  const params: Record<string, string | boolean> = {}
  if (query.status) params.status = query.status
  if (query.room_id) params.room_id = query.room_id
  if (query.assignee) params.assignee = query.assignee
  if (query.unassigned) params.unassigned = true
  return params
}

function parseList<T>(data: unknown): T[] {
  return Array.isArray(data) ? (data as T[]) : []
}

// Housekeeping ---------------------------------------------------------------

export function fetchHousekeepingTasks(query: ListTasksQuery = {}): Promise<HousekeepingTask[]> {
  const params = buildListParams(query)
  return api
    .get('/api/tasks/housekeeping', Object.keys(params).length ? { params } : {})
    .then(({ data }) => parseList<HousekeepingTask>(data))
}

export function fetchHousekeepingTask(id: string): Promise<HousekeepingTask> {
  return api.get(`/api/tasks/housekeeping/${id}`).then(({ data }) => data)
}

export function createHousekeepingTask(
  body: CreateHousekeepingTaskRequest,
): Promise<HousekeepingTask> {
  return api.post('/api/tasks/housekeeping', body).then(({ data }) => data)
}

export function updateHousekeepingTask(
  id: string,
  body: UpdateHousekeepingTaskRequest,
): Promise<HousekeepingTask> {
  return api.put(`/api/tasks/housekeeping/${id}`, body).then(({ data }) => data)
}

export function changeHousekeepingStatus(
  id: string,
  body: ChangeHousekeepingStatusRequest,
): Promise<HousekeepingTask> {
  return api.put(`/api/tasks/housekeeping/${id}/status`, body).then(({ data }) => data)
}

// Maintenance ----------------------------------------------------------------

export function fetchMaintenanceTasks(query: ListTasksQuery = {}): Promise<MaintenanceTask[]> {
  const params = buildListParams(query)
  return api
    .get('/api/tasks/maintenance', Object.keys(params).length ? { params } : {})
    .then(({ data }) => parseList<MaintenanceTask>(data))
}

export function fetchMaintenanceTask(id: string): Promise<MaintenanceTask> {
  return api.get(`/api/tasks/maintenance/${id}`).then(({ data }) => data)
}

export function createMaintenanceTask(
  body: CreateMaintenanceTaskRequest,
): Promise<MaintenanceTask> {
  return api.post('/api/tasks/maintenance', body).then(({ data }) => data)
}

export function updateMaintenanceTask(
  id: string,
  body: UpdateMaintenanceTaskRequest,
): Promise<MaintenanceTask> {
  return api.put(`/api/tasks/maintenance/${id}`, body).then(({ data }) => data)
}

export function changeMaintenanceStatus(
  id: string,
  body: ChangeMaintenanceStatusRequest,
): Promise<MaintenanceTask> {
  return api.put(`/api/tasks/maintenance/${id}/status`, body).then(({ data }) => data)
}
