import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { FormRef } from '@/shared/types/forms'
import { type FormTemplate, snapshotForm } from '@/shared/forms/formSnapshot'
import type {
  CreateEmployeeResponse,
  EmployeeDetailData,
  EmployeeListItem,
} from '@/features/employees/api'
import * as employeesApi from '@/features/employees/api'

export const useEmployeeStore = defineStore('employees', () => {
  const employees = ref<EmployeeListItem[]>([])
  const currentEmployee = ref<EmployeeDetailData | null>(null)
  const currentEmployeeFormRef = ref<FormRef | null>(null)

  const employeeCreateFormHash = ref<string | null>(null)
  const employeeFormTemplate = ref<FormTemplate | null>(null)
  const employeeFormRuntimeView = ref<FormTemplate | null>(null)

  async function fetchEmployees(params: { search?: string } = {}) {
    employees.value = await employeesApi.fetchEmployees(params)
    return employees.value
  }

  async function fetchEmployee(id: string) {
    const { data, formRef } = await employeesApi.fetchEmployee(id)
    currentEmployee.value = data
    currentEmployeeFormRef.value = formRef
    return data
  }

  async function fetchEmployeeForm(
    options: {
      force?: boolean
      target?: 'edit' | 'view'
      definitionHash?: string | null
      revalidate?: boolean
      ifNoneMatch?: string | null
    } = {},
  ) {
    const target = options.target ?? 'edit'
    const slot = target === 'view' ? employeeFormRuntimeView : employeeFormTemplate
    const hashOpt = options.definitionHash
    const isCreateEdit =
      target === 'edit' && (hashOpt === undefined || hashOpt === null || hashOpt === '')
    const revalidate = options.revalidate ?? (isCreateEdit && !options.force)
    const ifNoneMatch =
      options.ifNoneMatch ?? (isCreateEdit && !options.force ? employeeCreateFormHash.value : null)
    const res = await employeesApi.fetchEmployeeForm({
      target,
      force: options.force,
      definitionHash: hashOpt ?? null,
      revalidate,
      ifNoneMatch,
    })
    if (isCreateEdit && typeof res.hash === 'string' && res.hash.trim()) {
      employeeCreateFormHash.value = res.hash.trim()
    }
    const snap = snapshotForm(res)
    slot.value = snap
    return JSON.parse(JSON.stringify(snap))
  }

  async function fetchEmployeeFormDefinition() {
    const res = await employeesApi.fetchEmployeeFormDefinition()
    return {
      definition: JSON.parse(JSON.stringify(res.definition ?? {})),
      hash: res.hash,
    }
  }

  function replaceEmployeeFormTemplate(res: { definition?: unknown; data?: unknown }) {
    employeesApi.invalidateEmployeeRuntimeFormCache()
    employeeCreateFormHash.value = null
    employeeFormTemplate.value = null
    employeeFormRuntimeView.value = null
    if (res?.definition != null) {
      employeeFormTemplate.value = snapshotForm(res)
    }
  }

  async function createEmployee(data: Record<string, unknown>): Promise<CreateEmployeeResponse> {
    const created = await employeesApi.createEmployee(data)
    employees.value = [
      ...employees.value.filter((row) => row.id !== created.employee.id),
      created.employee,
    ]
    return created
  }

  async function updateEmployee(id: string, data: Record<string, unknown>) {
    const { data: profile, formRef } = await employeesApi.updateEmployee(id, data)
    currentEmployee.value = profile
    currentEmployeeFormRef.value = formRef
    return profile
  }

  function clearCurrentEmployee() {
    currentEmployee.value = null
    currentEmployeeFormRef.value = null
  }

  function resetState() {
    employees.value = []
    clearCurrentEmployee()
    employeeCreateFormHash.value = null
    employeeFormTemplate.value = null
    employeeFormRuntimeView.value = null
  }

  return {
    employees,
    currentEmployee,
    currentEmployeeFormRef,
    employeeFormTemplate,
    employeeFormRuntimeView,
    fetchEmployees,
    fetchEmployee,
    fetchEmployeeForm,
    fetchEmployeeFormDefinition,
    replaceEmployeeFormTemplate,
    createEmployee,
    updateEmployee,
    clearCurrentEmployee,
    resetState,
  }
})
