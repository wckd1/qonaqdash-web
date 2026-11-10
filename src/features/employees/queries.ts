import { defineQueryOptions, useMutation, useQueryCache } from '@pinia/colada'
import { invalidateKeys } from '@/shared/api/queryCache'
import { snapshotForm, type RuntimeFormSnapshot } from '@/shared/forms/formSnapshot'
import type { FormNode } from '@/shared/form-dsl/types'
import type { Permissions } from '@/shared/lib/permissions'
import * as employeesApi from '@/features/employees/api'

/** Search text as it goes into a key: trimmed, so `' a'` and `'a'` share an entry. */
function searchParam(search: string | undefined): { search: string } {
  return { search: search?.trim() ?? '' }
}

export const employeeKeys = {
  all: ['employees'] as const,
  lists: ['employees', 'list'] as const,
  list: (search?: string) => ['employees', 'list', searchParam(search)] as const,
  detail: (id: string) => ['employees', 'detail', id] as const,
  /** Occupation templates with their role groups. */
  occupations: ['employees', 'occupations'] as const,
  forms: ['employees', 'form'] as const,
  runtimeForm: (target: 'edit' | 'view', hash: string) =>
    ['employees', 'form', 'runtime', target, hash] as const,
  formDefinition: ['employees', 'form', 'definition'] as const,
}

/** Employees; without `search` the full list. */
export const employeeListQuery = defineQueryOptions((search?: string) => ({
  key: employeeKeys.list(search),
  query: ({ signal }) => employeesApi.fetchEmployees(searchParam(search), { signal }),
}))

/** `GET /api/employees/:id`: profile, occupations, permissions and the `_form` reference. */
export const employeeDetailQuery = defineQueryOptions((id: string) => ({
  key: employeeKeys.detail(id),
  query: ({ signal }) => employeesApi.fetchEmployee(id, { signal }),
}))

export const occupationsQuery = defineQueryOptions({
  key: employeeKeys.occupations,
  query: ({ signal }) => employeesApi.listOccupations({ signal }),
})

/**
 * Runtime employee form for a definition hash. Each load revalidates it with
 * `If-None-Match`, as the employee screens did before.
 */
export const employeeRuntimeFormQuery = defineQueryOptions(
  ({ target, hash }: { target: 'edit' | 'view'; hash: string }) => ({
    key: employeeKeys.runtimeForm(target, hash),
    query: async (): Promise<RuntimeFormSnapshot> => {
      const res = await employeesApi.fetchEmployeeForm({
        target,
        definitionHash: hash || null,
        revalidate: true,
        ifNoneMatch: hash || null,
      })
      return { ...snapshotForm(res), hash: res.hash ?? '' }
    },
  }),
)

/**
 * Edit form for a new employee. Every open revalidates it with `If-None-Match`
 * and the last known hash.
 */
export const employeeCreateFormQuery = defineQueryOptions({
  key: employeeKeys.runtimeForm('edit', ''),
  staleTime: 0,
  query: async ({ entry }): Promise<RuntimeFormSnapshot> => {
    const previous = entry.state.value.data as RuntimeFormSnapshot | undefined
    const res = await employeesApi.fetchEmployeeForm({
      target: 'edit',
      revalidate: true,
      ifNoneMatch: previous?.hash || null,
    })
    return { ...snapshotForm(res), hash: res.hash?.trim() || previous?.hash || '' }
  },
})

/** Persisted definition for the form builder. */
export const employeeFormDefinitionQuery = defineQueryOptions({
  key: employeeKeys.formDefinition,
  query: ({ signal }) => employeesApi.fetchEmployeeFormDefinition({ signal }),
})

export function useCreateEmployeeMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (data: Record<string, unknown>) => employeesApi.createEmployee(data),
    onSuccess: () => invalidateKeys(queryCache, [employeeKeys.lists]),
  })
}

export function useUpdateEmployeeMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; data: Record<string, unknown> }) =>
      employeesApi.updateEmployee(vars.id, vars.data),
    onSuccess: (payload, vars) => {
      queryCache.setQueryData(employeeKeys.detail(vars.id), payload)
      return invalidateKeys(queryCache, [employeeKeys.lists])
    },
  })
}

/** Occupations drive effective permissions, which the backend recomputes. */
export function useReplaceEmployeeOccupationsMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { employeeId: string; occupationIds: string[] }) =>
      employeesApi.replaceEmployeeOccupations(vars.employeeId, vars.occupationIds),
    onSuccess: (_data, vars) => invalidateKeys(queryCache, [employeeKeys.detail(vars.employeeId)]),
  })
}

export function useReplaceEmployeePermissionsMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { employeeId: string; overrides: Permissions }) =>
      employeesApi.replaceEmployeePermissions(vars.employeeId, vars.overrides),
    onSuccess: (_data, vars) => invalidateKeys(queryCache, [employeeKeys.detail(vars.employeeId)]),
  })
}

type OccupationBody = Parameters<typeof employeesApi.createOccupation>[0]

/** A template change also changes the permissions of every employee who holds it. */
export function useCreateOccupationMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (body: OccupationBody) => employeesApi.createOccupation(body),
    onSuccess: () => invalidateKeys(queryCache, [employeeKeys.occupations]),
  })
}

export function useUpdateOccupationMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (vars: { id: string; body: OccupationBody }) =>
      employeesApi.updateOccupation(vars.id, vars.body),
    onSuccess: () =>
      invalidateKeys(queryCache, [employeeKeys.occupations, ['employees', 'detail']]),
  })
}

export function useDeleteOccupationMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (id: string) => employeesApi.deleteOccupation(id),
    onSuccess: () =>
      invalidateKeys(queryCache, [employeeKeys.occupations, ['employees', 'detail']]),
  })
}

export function useUpdateEmployeeFormDefinitionMutation() {
  const queryCache = useQueryCache()
  return useMutation({
    mutation: (definition: FormNode) => employeesApi.updateEmployeeFormDefinition({ definition }),
    onSuccess: () => {
      employeesApi.invalidateEmployeeRuntimeFormCache()
      // Employees carry the hash of their form definition in `_form`.
      return invalidateKeys(queryCache, [employeeKeys.all])
    },
  })
}
