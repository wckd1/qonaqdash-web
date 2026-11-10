import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type QueryOf, type Schemas } from '@/shared/api/typed'

export type HousekeepingTask = Schemas['taskshttp.HousekeepingTaskResponse']
export type MaintenanceTask = Schemas['taskshttp.MaintenanceTaskResponse']
export type HousekeepingTaskStatus = HousekeepingTask['status']
export type MaintenanceTaskStatus = MaintenanceTask['status']
export type TaskStatus = HousekeepingTaskStatus | MaintenanceTaskStatus
export type TaskSource = HousekeepingTask['source']
export type CreateHousekeepingTaskRequest = Schemas['taskshttp.CreateHousekeepingTaskRequest']
export type CreateMaintenanceTaskRequest = Schemas['taskshttp.CreateMaintenanceTaskRequest']
export type UpdateHousekeepingTaskRequest = Schemas['taskshttp.UpdateHousekeepingTaskRequest']
export type UpdateMaintenanceTaskRequest = Schemas['taskshttp.UpdateMaintenanceTaskRequest']
export type ChangeHousekeepingStatusRequest =
  Schemas['taskshttp.ChangeHousekeepingTaskStatusRequest']
export type ChangeMaintenanceStatusRequest = Schemas['taskshttp.ChangeMaintenanceTaskStatusRequest']
export type HousekeepingTaskQuery = QueryOf<'/api/tasks/housekeeping', 'get'>
export type MaintenanceTaskQuery = QueryOf<'/api/tasks/maintenance', 'get'>

/** Task board tab: each domain has its own endpoints. */
export type TaskDomain = 'housekeeping' | 'maintenance'

/** Only the filters that are set, so the request carries no empty parameters. */
function listQuery<Q extends HousekeepingTaskQuery | MaintenanceTaskQuery>(query: Q): Q {
  const params: Record<string, unknown> = {}
  if (query.status) params.status = query.status
  if (query.room_id) params.room_id = query.room_id
  if (query.assignee) params.assignee = query.assignee
  if (query.unassigned) params.unassigned = true
  return params as Q
}

// Housekeeping ---------------------------------------------------------------

export function fetchHousekeepingTasks(
  query: HousekeepingTaskQuery = {},
  options: RequestOptions = {},
): Promise<HousekeepingTask[]> {
  return typedApi
    .get('/api/tasks/housekeeping', { query: listQuery(query), signal: options.signal })
    .then(({ data }) => data)
}

export function fetchHousekeepingTask(id: string): Promise<HousekeepingTask> {
  return typedApi.get('/api/tasks/housekeeping/{id}', { path: { id } }).then(({ data }) => data)
}

export function createHousekeepingTask(
  body: CreateHousekeepingTaskRequest,
): Promise<HousekeepingTask> {
  return typedApi.post('/api/tasks/housekeeping', { body }).then(({ data }) => data)
}

export function updateHousekeepingTask(
  id: string,
  body: UpdateHousekeepingTaskRequest,
): Promise<HousekeepingTask> {
  return typedApi
    .put('/api/tasks/housekeeping/{id}', { path: { id }, body })
    .then(({ data }) => data)
}

export function changeHousekeepingStatus(
  id: string,
  body: ChangeHousekeepingStatusRequest,
): Promise<HousekeepingTask> {
  return typedApi
    .put('/api/tasks/housekeeping/{id}/status', { path: { id }, body })
    .then(({ data }) => data)
}

// Maintenance ----------------------------------------------------------------

export function fetchMaintenanceTasks(
  query: MaintenanceTaskQuery = {},
  options: RequestOptions = {},
): Promise<MaintenanceTask[]> {
  return typedApi
    .get('/api/tasks/maintenance', { query: listQuery(query), signal: options.signal })
    .then(({ data }) => data)
}

export function fetchMaintenanceTask(id: string): Promise<MaintenanceTask> {
  return typedApi.get('/api/tasks/maintenance/{id}', { path: { id } }).then(({ data }) => data)
}

export function createMaintenanceTask(
  body: CreateMaintenanceTaskRequest,
): Promise<MaintenanceTask> {
  return typedApi.post('/api/tasks/maintenance', { body }).then(({ data }) => data)
}

export function updateMaintenanceTask(
  id: string,
  body: UpdateMaintenanceTaskRequest,
): Promise<MaintenanceTask> {
  return typedApi
    .put('/api/tasks/maintenance/{id}', { path: { id }, body })
    .then(({ data }) => data)
}

export function changeMaintenanceStatus(
  id: string,
  body: ChangeMaintenanceStatusRequest,
): Promise<MaintenanceTask> {
  return typedApi
    .put('/api/tasks/maintenance/{id}/status', { path: { id }, body })
    .then(({ data }) => data)
}
