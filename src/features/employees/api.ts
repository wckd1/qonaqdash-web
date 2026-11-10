import type { RequestOptions } from '@/shared/api/client'
import { typedApi, type Schemas } from '@/shared/api/typed'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormNode, FormRef } from '@/shared/types/forms'
import type { Permissions } from '@/shared/lib/permissions'

export type { FormRef }

export type EmployeeListItem = Schemas['iamhttp.EmployeeListItem']
export type EmployeeDetailResponse = Schemas['iamhttp.EmployeeDetailResponse']
/** Employee profile as FormDSL data: contract fields plus the organization's custom fields. */
export type EmployeeDetailData = EmployeeDetailResponse & Record<string, unknown>
/** Body of create and update: contract fields plus the organization's custom fields. */
export type EmployeeDataRequest = Schemas['iamhttp.EmployeeDataRequest'] & Record<string, unknown>
export type CreateEmployeeResponse = Schemas['iamhttp.CreateEmployeeResponse']
export type OccupationRoleKey = Schemas['iamhttp.OccupationResponse']['role_key']
/** Occupation template; `permissions` as the partial bundle the permission matrix edits. */
export type OccupationTemplate = Omit<Schemas['iamhttp.OccupationResponse'], 'permissions'> & {
  permissions: Permissions
}
export type OccupationSummary = Schemas['iamhttp.OccupationSummaryResponse']
export type OccupationRoleGroup = Schemas['iamhttp.OccupationRoleGroupResponse']
export type EmployeeOccupationsResponse = Schemas['iamhttp.EmployeeOccupationsResponse']
export type EmployeePermissionsResponse = Schemas['iamhttp.EmployeePermissionsResponse']

/** Runtime employee form (`GET /api/employees/form?target=`) as the form loader returns it. */
export interface EmployeeFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: Record<string, unknown>
}

export interface EmployeeDetailPayload {
  data: EmployeeDetailData
  formRef: FormRef | null
}

export function parseEmployeeDetailPayload(raw: EmployeeDetailResponse): EmployeeDetailPayload {
  return {
    data: { ...raw },
    formRef: normalizeFormRef(raw._form),
  }
}

export function fetchEmployees(
  params: { search?: string } = {},
  options: RequestOptions = {},
): Promise<EmployeeListItem[]> {
  const search = params.search?.trim()
  return typedApi
    .get('/api/employees', { query: search ? { search } : {}, signal: options.signal })
    .then(({ data }) => data)
}

export function fetchEmployee(
  id: string,
  options: RequestOptions = {},
): Promise<EmployeeDetailPayload> {
  return typedApi
    .get('/api/employees/{employee_id}', { path: { employee_id: id }, signal: options.signal })
    .then(({ data }) => parseEmployeeDetailPayload(data))
}

export function loadEmployeeRuntimeForm(
  mode: 'edit' | 'view',
  definitionHash: string | null | undefined,
  options: LoadRuntimeFormOptions = {},
) {
  return loadRuntimeFormDefinition('employee', '/api/employees/form', mode, definitionHash, options)
}

export async function fetchEmployeeForm(
  options: {
    target?: 'edit' | 'view'
    force?: boolean
    definitionHash?: string | null
    revalidate?: boolean
    ifNoneMatch?: string | null
  } = {},
): Promise<EmployeeFormDefinitionResponse> {
  const target = options.target ?? 'edit'
  const loaded = await loadEmployeeRuntimeForm(target, options.definitionHash ?? null, {
    force: options.force,
    revalidate: options.revalidate,
    ifNoneMatch: options.ifNoneMatch,
  })
  return {
    definition: loaded.definition,
    hash: loaded.hash,
    data: loaded.data,
  }
}

export function invalidateEmployeeRuntimeFormCache(): void {
  clearFormDefinitionsFor('employee')
}

/** The contract keeps `definition` free-form; the builder reads it as FormDSL. */
function formDefinition(data: Schemas['iamhttp.FormResponse']): {
  definition: FormNode
  hash: string
} {
  return { definition: data.definition as unknown as FormNode, hash: data.hash }
}

export function fetchEmployeeFormDefinition(options: RequestOptions = {}): Promise<{
  definition: FormNode
  hash: string
}> {
  return typedApi
    .get('/api/employees/form/definition', { signal: options.signal })
    .then(({ data }) => formDefinition(data))
}

export function updateEmployeeFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return typedApi
    .put('/api/employees/form/definition', {
      body: { definition: body.definition as unknown as Record<string, unknown> },
    })
    .then(({ data }) => formDefinition(data))
}

/** `data` is FormDSL data of the organization's employee form; its rules checked it. */
export async function createEmployee(
  data: Record<string, unknown>,
): Promise<CreateEmployeeResponse> {
  return typedApi
    .post('/api/employees', { body: data as EmployeeDataRequest })
    .then(({ data: res }) => res)
}

export function updateEmployee(
  id: string,
  data: Record<string, unknown>,
): Promise<EmployeeDetailPayload> {
  return typedApi
    .put('/api/employees/{employee_id}', {
      path: { employee_id: id },
      body: data as EmployeeDataRequest,
    })
    .then(({ data: res }) => parseEmployeeDetailPayload(res))
}

export function listOccupations(options: RequestOptions = {}): Promise<OccupationRoleGroup[]> {
  return typedApi.get('/api/occupations', { signal: options.signal }).then(({ data }) => data)
}

type OccupationBody = {
  title: string
  role_key: OccupationRoleKey
  permissions: Permissions
}

export function createOccupation(body: OccupationBody): Promise<OccupationTemplate> {
  return typedApi.post('/api/occupations', { body }).then(({ data }) => data)
}

export function updateOccupation(
  occupationId: string,
  body: OccupationBody,
): Promise<OccupationTemplate> {
  return typedApi
    .put('/api/occupations/{occupation_id}', { path: { occupation_id: occupationId }, body })
    .then(({ data }) => data)
}

export function deleteOccupation(occupationId: string): Promise<void> {
  return typedApi
    .delete('/api/occupations/{occupation_id}', { path: { occupation_id: occupationId } })
    .then(() => undefined)
}

export function replaceEmployeeOccupations(
  employeeId: string,
  occupationIds: string[],
): Promise<EmployeeOccupationsResponse> {
  return typedApi
    .put('/api/employees/{employee_id}/occupations', {
      path: { employee_id: employeeId },
      body: { occupation_ids: occupationIds },
    })
    .then(({ data }) => data)
}

export function replaceEmployeePermissions(
  employeeId: string,
  overrides: Permissions,
): Promise<EmployeePermissionsResponse> {
  return typedApi
    .put('/api/employees/{employee_id}/permissions', {
      path: { employee_id: employeeId },
      body: { overrides },
    })
    .then(({ data }) => data)
}
