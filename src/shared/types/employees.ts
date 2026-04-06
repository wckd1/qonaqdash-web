import type { FormNode, FormRef } from './forms'

export interface EmployeeListItem {
  id: string
  first_name?: string
  last_name?: string
  email?: string
}

export interface EmployeeDetailData {
  id?: string
  first_name?: string
  last_name?: string
  email?: string
  phone?: string
  _form?: FormRef
  [key: string]: unknown
}

export interface EmployeeFormDefinitionResponse {
  definition?: FormNode
  hash?: string
  data?: Record<string, unknown>
}

export interface CreateEmployeeResponse {
  employee: EmployeeListItem
  invite_token: string
}
