import api from '@/shared/api/client'
import { clearFormDefinitionsFor, normalizeFormRef } from '@/shared/forms/formDefinitionCache'
import {
  loadRuntimeFormDefinition,
  type LoadRuntimeFormOptions,
} from '@/shared/forms/loadRuntimeFormDefinition'
import type { FormNode, FormRef } from '@/shared/types/forms'
import type {
  CreateEmployeeResponse,
  EmployeeDetailData,
  EmployeeFormDefinitionResponse,
  EmployeeListItem,
  EmployeeOccupationsResponse,
  EmployeePermissionsResponse,
  OccupationRoleGroup,
  OccupationTemplate,
} from '@/shared/types/employees'
import { parsePermissions } from '@/shared/lib/permissions'

export type {
  CreateEmployeeResponse,
  EmployeeDetailData,
  EmployeeFormDefinitionResponse,
  EmployeeListItem,
  EmployeeOccupationsResponse,
  EmployeePermissionsResponse,
  OccupationRoleGroup,
  OccupationTemplate,
} from '@/shared/types/employees'

export type { FormRef }

export interface EmployeeDetailPayload {
  data: EmployeeDetailData
  formRef: FormRef | null
}

function normalizeOccupation(raw: unknown): OccupationTemplate {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: typeof o.id === 'string' ? o.id : '',
    title: typeof o.title === 'string' ? o.title : '',
    role_key: typeof o.role_key === 'string' ? o.role_key : '',
    role_title: typeof o.role_title === 'string' ? o.role_title : '',
    permissions: parsePermissions(o.permissions),
  }
}

function normalizeOccupationRoleGroup(raw: unknown): OccupationRoleGroup {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    role_key: typeof o.role_key === 'string' ? o.role_key : '',
    role_title: typeof o.role_title === 'string' ? o.role_title : '',
    occupations: Array.isArray(o.occupations)
      ? o.occupations.map(normalizeOccupation).filter((row) => row.id)
      : [],
  }
}

function normalizeEmployeeListItem(raw: unknown): EmployeeListItem {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  return {
    id: typeof o.id === 'string' ? o.id : '',
    first_name: typeof o.first_name === 'string' ? o.first_name : undefined,
    last_name: typeof o.last_name === 'string' ? o.last_name : undefined,
    email: typeof o.email === 'string' ? o.email : undefined,
  }
}

export function parseEmployeeDetailPayload(raw: unknown): EmployeeDetailPayload {
  const o = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const formRef = normalizeFormRef(o._form)
  return {
    data: {
      ...(o as EmployeeDetailData),
    },
    formRef,
  }
}

export function fetchEmployees(params: { search?: string } = {}): Promise<EmployeeListItem[]> {
  const config = params.search?.trim() ? { params: { search: params.search.trim() } } : {}
  return api
    .get('/api/employees', config)
    .then(({ data }) => (Array.isArray(data) ? data : (data?.employees ?? data ?? [])))
    .then((rows) => rows.map(normalizeEmployeeListItem).filter((row) => row.id))
}

export function fetchEmployee(id: string): Promise<EmployeeDetailPayload> {
  return api.get(`/api/employees/${id}`).then(({ data }) => parseEmployeeDetailPayload(data))
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

export function fetchEmployeeFormDefinition(): Promise<{
  definition: FormNode
  hash: string
}> {
  return api.get('/api/employees/form/definition').then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
}

export function updateEmployeeFormDefinition(body: {
  definition: FormNode
}): Promise<{ definition: FormNode; hash: string }> {
  return api.put('/api/employees/form/definition', body).then(({ data }) => ({
    definition: (data.definition ?? {}) as FormNode,
    hash: String(data.hash ?? ''),
  }))
}

export async function createEmployee(
  data: Record<string, unknown>,
): Promise<CreateEmployeeResponse> {
  return api.post('/api/employees', data).then(({ data: res }) => ({
    employee: normalizeEmployeeListItem(res?.employee ?? res),
    invite_token: typeof res?.invite_token === 'string' ? res.invite_token : '',
  }))
}

export function updateEmployee(
  id: string,
  data: Record<string, unknown>,
): Promise<EmployeeDetailPayload> {
  return api
    .put(`/api/employees/${id}`, data)
    .then(({ data: res }) => parseEmployeeDetailPayload(res))
}

export function listOccupations(): Promise<OccupationRoleGroup[]> {
  return api
    .get('/api/occupations')
    .then(({ data }) => (Array.isArray(data) ? data : (data?.role_groups ?? data ?? [])))
    .then((rows) =>
      rows.map(normalizeOccupationRoleGroup).filter((row) => row.role_key && row.role_title),
    )
}

export function createOccupation(body: {
  title: string
  role_key: string
  permissions: OccupationTemplate['permissions']
}): Promise<OccupationTemplate> {
  return api.post('/api/occupations', body).then(({ data }) => normalizeOccupation(data))
}

export function updateOccupation(
  occupationId: string,
  body: {
    title: string
    role_key: string
    permissions: OccupationTemplate['permissions']
  },
): Promise<OccupationTemplate> {
  return api
    .put(`/api/occupations/${occupationId}`, body)
    .then(({ data }) => normalizeOccupation(data))
}

export function deleteOccupation(occupationId: string): Promise<void> {
  return api.delete(`/api/occupations/${occupationId}`).then(() => undefined)
}

export function replaceEmployeeOccupations(
  employeeId: string,
  occupationIds: string[],
): Promise<EmployeeOccupationsResponse> {
  return api
    .put(`/api/employees/${employeeId}/occupations`, { occupation_ids: occupationIds })
    .then(({ data }) => ({
      employee_id: typeof data?.employee_id === 'string' ? data.employee_id : employeeId,
      occupation_ids: Array.isArray(data?.occupation_ids)
        ? data.occupation_ids.filter((value: unknown): value is string => typeof value === 'string')
        : [],
      occupations: Array.isArray(data?.occupations)
        ? data.occupations.map(normalizeOccupation).filter((row) => row.id)
        : [],
    }))
}

export function replaceEmployeePermissions(
  employeeId: string,
  overrides: EmployeePermissionsResponse['permission_overrides'],
): Promise<EmployeePermissionsResponse> {
  return api.put(`/api/employees/${employeeId}/permissions`, { overrides }).then(({ data }) => ({
    employee_id: typeof data?.employee_id === 'string' ? data.employee_id : employeeId,
    occupation_ids: Array.isArray(data?.occupation_ids)
      ? data.occupation_ids.filter((value: unknown): value is string => typeof value === 'string')
      : [],
    occupation_templates: Array.isArray(data?.occupation_templates)
      ? data.occupation_templates.map(normalizeOccupation).filter((row) => row.id)
      : [],
    permission_overrides: parsePermissions(data?.permission_overrides),
    effective_permissions: parsePermissions(data?.effective_permissions),
  }))
}
