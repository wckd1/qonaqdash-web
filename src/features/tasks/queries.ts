import { defineQueryOptions, useMutation, useQueryCache, type QueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import { propertyKeys } from '@/features/property/queries'
import * as tasksApi from '@/features/tasks/api'
import type { ListTasksQuery, TaskDomain } from '@/shared/types/tasks'

/** Task list filter as it goes into a key: plain JSON, no `undefined` values. */
function listParams(query: ListTasksQuery) {
  return {
    status: query.status ?? '',
    room_id: query.room_id ?? '',
    assignee: query.assignee ?? '',
    unassigned: !!query.unassigned,
  }
}

export const taskKeys = {
  all: ['tasks'] as const,
  domain: (domain: TaskDomain) => ['tasks', domain] as const,
  list: (domain: TaskDomain, query: ListTasksQuery) =>
    ['tasks', domain, 'list', listParams(query)] as const,
}

export const taskListQuery = defineQueryOptions(
  ({ domain, query }: { domain: TaskDomain; query: ListTasksQuery }) => ({
    key: taskKeys.list(domain, query),
    query: ({ signal }): Promise<Array<tasksApi.HousekeepingTask | tasksApi.MaintenanceTask>> =>
      domain === 'maintenance'
        ? tasksApi.fetchMaintenanceTasks(query, { signal })
        : tasksApi.fetchHousekeepingTasks(query, { signal }),
  }),
)

/**
 * Keys a task change touches: the tasks of its domain, and the rooms and the
 * reservation grid, because room housekeeping and maintenance states follow
 * the tasks of the room.
 */
function invalidateAfterTaskChange(queryCache: QueryCache, domain: TaskDomain) {
  return invalidateKeys(queryCache, [
    taskKeys.domain(domain),
    propertyKeys.rooms,
    ['bookings', 'grid'],
  ])
}

export function useCreateHousekeepingTaskMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: tasksApi.CreateHousekeepingTaskRequest) =>
      tasksApi.createHousekeepingTask(body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'housekeeping'),
  })
}

export function useUpdateHousekeepingTaskMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: tasksApi.UpdateHousekeepingTaskRequest }) =>
      tasksApi.updateHousekeepingTask(vars.id, vars.body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'housekeeping'),
  })
}

export function useChangeHousekeepingStatusMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: tasksApi.ChangeHousekeepingStatusRequest }) =>
      tasksApi.changeHousekeepingStatus(vars.id, vars.body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'housekeeping'),
  })
}

export function useCreateMaintenanceTaskMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: tasksApi.CreateMaintenanceTaskRequest) => tasksApi.createMaintenanceTask(body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'maintenance'),
  })
}

export function useUpdateMaintenanceTaskMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: tasksApi.UpdateMaintenanceTaskRequest }) =>
      tasksApi.updateMaintenanceTask(vars.id, vars.body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'maintenance'),
  })
}

export function useChangeMaintenanceStatusMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: tasksApi.ChangeMaintenanceStatusRequest }) =>
      tasksApi.changeMaintenanceStatus(vars.id, vars.body),
    onSuccess: () => invalidateAfterTaskChange(queryCache, 'maintenance'),
  })
}
