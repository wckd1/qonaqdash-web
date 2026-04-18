<template>
  <header class="page-header">
    <h1>{{ employeeDisplayName }}</h1>
    <div
      v-if="employeeId && employeeForm && !editing && canManageEmployees"
      class="page-header-actions"
    >
      <button type="button" class="btn-secondary" @click="editing = true">
        {{ t('common.edit') }}
      </button>
    </div>
    <div
      v-else-if="employeeId && employeeForm && editing && canManageEmployees"
      class="page-header-actions"
    >
      <button type="button" :disabled="submitting" @click="onSave">
        {{ submitting ? t('common.saving') : t('common.save') }}
      </button>
      <button type="button" class="btn-secondary" :disabled="submitting" @click="cancelEdit">
        {{ t('common.cancel') }}
      </button>
    </div>
  </header>

  <p v-if="loadError" class="error-message">{{ loadError }}</p>
  <p v-else-if="notFound" class="error-message">
    {{ t('employees.not_found') }}
    <router-link :to="{ name: 'employees' }" class="inline-link">
      {{ t('employees.back_to_list') }}
    </router-link>
  </p>
  <template v-else-if="currentEmployee">
    <div class="employee-detail-body">
      <div class="employee-detail-form">
        <template v-if="employeeForm">
          <FormView
            v-if="!editing"
            :definition="employeeForm.definition"
            :data="employeeForm.data"
          />
          <template v-else>
            <FormEdit
              :definition="employeeForm.definition"
              :data="editFormData"
              :errors-map="errorsMap"
              @update:data="editFormData = $event"
            />
          </template>
        </template>
        <p v-else class="section-placeholder">{{ t('employees.details_loading') }}</p>
      </div>
      <section
        v-if="employeeId && canManageEmployeePermissions"
        class="panel employee-detail-access"
        aria-labelledby="employee-access-settings-heading"
      >
        <h2 id="employee-access-settings-heading" class="employee-detail-access__title">
          {{ t('employees.roles_and_occupations_section') }}
        </h2>

        <p v-if="accessError" class="error-message">{{ accessError }}</p>
        <div v-else-if="accessLoading" class="loading-state">{{ t('common.loading') }}</div>
        <template v-else>
          <p v-if="!assignedOccupations.length" class="empty-state">
            {{ t('employees.no_occupations_assigned') }}
          </p>
          <ul v-else class="employee-detail-access__chips">
            <li
              v-for="occ in assignedOccupations"
              :key="occ.id"
              class="employee-detail-access__chip"
            >
              <span class="employee-detail-access__chip-title">{{ displayTitle(occ.title) }}</span>
              <span class="employee-detail-access__chip-role">
                {{ roleLabel(occ.role_key, occ.role_title) }}
              </span>
            </li>
          </ul>

          <div class="employee-detail-access__footer">
            <button type="button" class="btn-secondary" @click="occupationsDialogOpen = true">
              {{ t('employees.manage_occupations_action') }}
            </button>
            <button type="button" class="btn-secondary" @click="permissionsDialogOpen = true">
              {{ t('employees.manage_permissions_action') }}
            </button>
          </div>
        </template>
      </section>

      <ManageOccupationsDialog
        v-if="occupationsDialogOpen && employeeId"
        :employee-id="employeeId"
        :initial-occupation-ids="selectedOccupationIds"
        @close="occupationsDialogOpen = false"
        @saved="onOccupationsSaved"
      />

      <ManagePermissionsDialog
        v-if="permissionsDialogOpen && employeeId"
        :employee-id="employeeId"
        :initial-permissions="effectivePermissions"
        :initial-overrides="permissionOverrides"
        @close="permissionsDialogOpen = false"
        @saved="onPermissionsSaved"
      />
    </div>
  </template>
  <div v-else class="loading-state">{{ t('common.loading') }}</div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { formatDocumentTitle } from '@/shared/i18n/documentTitle'
import { useEmployeeStore } from '@/features/employees/stores/useEmployeeStore'
import { useAuthStore } from '@/features/auth/stores/useAuthStore'
import { useSettingsStore } from '@/shared/stores/useSettingsStore'
import FormView from '@/shared/form-dsl/FormView.vue'
import FormEdit from '@/shared/form-dsl/FormEdit.vue'
import ManageOccupationsDialog from '@/features/employees/components/ManageOccupationsDialog.vue'
import ManagePermissionsDialog from '@/features/employees/components/ManagePermissionsDialog.vue'
import { composeEntityFormFromTemplate } from '@/shared/form-dsl/normalizeFormResponse'
import { formatUnknownApiError, formErrorsMapFromHttpError } from '@/shared/i18n/apiError'
import { httpErrorResponse } from '@/shared/unknownError'
import { validateFormData } from '@/shared/form-dsl/validateFormData'
import { scrollToFirstFormError } from '@/shared/form-dsl/scrollToFirstError'
import { useNotification } from '@/shared/composables/useNotification'
import { usePermissions } from '@/shared/composables/usePermissions'
import type {
  EmployeeOccupationsResponse,
  EmployeePermissionsResponse,
  OccupationTemplate,
  Permissions,
} from '@/shared/types/permissions'
import { clonePermissions, parsePermissions } from '@/shared/lib/permissions'

const { t, te, locale } = useI18n()
const route = useRoute()
const store = useEmployeeStore()
const authStore = useAuthStore()
const settingsStore = useSettingsStore()
const { success } = useNotification()
const { canManageEmployees, canManageEmployeePermissions } = usePermissions()
const { currentEmployee, currentEmployeeFormRef, employeeFormTemplate, employeeFormRuntimeView } =
  storeToRefs(store)

const loadError = ref('')
const notFound = ref(false)
const editing = ref(false)
const editFormData = ref<Record<string, unknown>>({})
const errorsMap = ref<Record<string, string[]>>({})
const submitting = ref(false)
const accessLoading = ref(false)
const accessError = ref('')
const assignedOccupations = ref<OccupationTemplate[]>([])
const selectedOccupationIds = ref<string[]>([])
const effectivePermissions = ref<Permissions>({})
const permissionOverrides = ref<Permissions>({})
const occupationsDialogOpen = ref(false)
const permissionsDialogOpen = ref(false)

function routeEmployeeId(): string | null {
  const id = route.params.id
  if (typeof id === 'string' && id) return id
  if (Array.isArray(id) && id[0]) return id[0]
  return null
}

const employeeId = computed(() => routeEmployeeId())

const employeeForm = computed(() =>
  composeEntityFormFromTemplate(
    currentEmployee.value ?? null,
    employeeFormRuntimeView.value ?? employeeFormTemplate.value,
  ),
)

const employeeDisplayName = computed(() => {
  void locale.value
  const employee = currentEmployee.value
  if (!employee) return t('page_title.employee')
  const first = typeof employee.first_name === 'string' ? employee.first_name : ''
  const last = typeof employee.last_name === 'string' ? employee.last_name : ''
  const parts = [first, last].filter(Boolean)
  if (parts.length) return parts.join(' ')
  if (typeof employee.email === 'string' && employee.email) return employee.email
  return t('page_title.employee')
})

function roleLabel(roleKey: string, roleTitleKey: string): string {
  void locale.value
  if (roleTitleKey && te(roleTitleKey)) return t(roleTitleKey)
  const source = roleKey.trim()
  if (!source) return t('employees.role_unknown')
  return source
    .split('_')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function displayTitle(title: string): string {
  void locale.value
  const source = (title ?? '').trim()
  if (!source) return t('occupations.untitled')
  return te(source) ? t(source) : source
}

async function load() {
  const id = routeEmployeeId()
  if (!id) return
  store.clearCurrentEmployee()
  loadError.value = ''
  notFound.value = false
  try {
    await store.fetchEmployee(id)
    await store.fetchEmployeeForm({
      target: 'view',
      definitionHash: currentEmployeeFormRef.value?.hash ?? null,
      revalidate: true,
      ifNoneMatch: currentEmployeeFormRef.value?.hash ?? null,
    })
  } catch (err: unknown) {
    if (httpErrorResponse(err)?.status === 404) {
      store.clearCurrentEmployee()
      notFound.value = true
    } else {
      loadError.value = formatUnknownApiError(err) || t('employees.load_failed')
    }
  }
}

function loadAccessSettings() {
  if (!canManageEmployeePermissions.value) return
  accessLoading.value = true
  accessError.value = ''
  try {
    const emp = currentEmployee.value as Record<string, unknown> | null
    const rawOccs = emp?.occupations
    const occupations: OccupationTemplate[] = Array.isArray(rawOccs)
      ? (rawOccs as OccupationTemplate[]).filter((o) => o && typeof o.id === 'string')
      : []
    assignedOccupations.value = occupations
    selectedOccupationIds.value = occupations.map((o) => o.id)
    effectivePermissions.value = clonePermissions(parsePermissions(emp?.effective_permissions))
    permissionOverrides.value = clonePermissions(parsePermissions(emp?.permission_overrides))
  } catch (err: unknown) {
    accessError.value = formatUnknownApiError(err) || t('employees.access_settings_load_failed')
    assignedOccupations.value = []
    selectedOccupationIds.value = []
    effectivePermissions.value = {}
    permissionOverrides.value = {}
  } finally {
    accessLoading.value = false
  }
}

watch(editing, (isEdit) => {
  if (isEdit && employeeForm.value) {
    editFormData.value = { ...employeeForm.value.data }
    errorsMap.value = {}
  }
})

watch(
  () => route.params.id,
  async (newId) => {
    editing.value = false
    if (!newId) return
    await load()
    if (canManageEmployeePermissions.value && !notFound.value && !loadError.value) {
      void loadAccessSettings()
    }
  },
  { immediate: true },
)

watch(
  [employeeDisplayName, locale],
  () => {
    document.title = formatDocumentTitle(employeeDisplayName.value)
  },
  { immediate: true },
)

function cancelEdit() {
  editing.value = false
  if (employeeForm.value) editFormData.value = { ...employeeForm.value.data }
}

async function onSave() {
  if (!employeeId.value || !employeeForm.value) return
  errorsMap.value = {}
  const { valid, errorsMap: clientErrors } = validateFormData(
    employeeForm.value.definition,
    editFormData.value,
  )
  if (!valid) {
    errorsMap.value = clientErrors
    scrollToFirstFormError()
    return
  }
  submitting.value = true
  try {
    await store.updateEmployee(employeeId.value, editFormData.value)
    editing.value = false
    success(t('employees.saved'))
  } catch (err: unknown) {
    const mapped = formErrorsMapFromHttpError(err)
    if (mapped) {
      errorsMap.value = mapped
      scrollToFirstFormError()
    } else {
      const msg = formatUnknownApiError(err) || t('employees.save_failed')
      errorsMap.value = { '': [msg] }
    }
  } finally {
    submitting.value = false
  }
}

async function onOccupationsSaved(res: EmployeeOccupationsResponse) {
  assignedOccupations.value = Array.isArray(res.occupations) ? res.occupations : []
  selectedOccupationIds.value = Array.isArray(res.occupation_ids) ? [...res.occupation_ids] : []
  occupationsDialogOpen.value = false
  // Occupations drive effective permissions, which the backend recomputes — reload the
  // employee so permission_overrides / effective_permissions snapshots stay in sync.
  const id = employeeId.value
  if (id) {
    try {
      await store.fetchEmployee(id)
      loadAccessSettings()
    } catch {
      /* load() handles errors for the main page */
    }
  }
  if (authStore.employeeId === id) {
    await settingsStore.fetchUserSettings().catch(() => undefined)
  }
}

async function onPermissionsSaved(res: EmployeePermissionsResponse) {
  effectivePermissions.value = clonePermissions(res.effective_permissions)
  permissionOverrides.value = clonePermissions(res.permission_overrides)
  permissionsDialogOpen.value = false
  if (authStore.employeeId === employeeId.value) {
    await settingsStore.fetchUserSettings().catch(() => undefined)
  }
}
</script>

<style scoped>
.employee-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  min-width: 0;
  overflow-y: auto;
  overflow-x: hidden;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding-bottom: var(--space-md);
  box-sizing: border-box;
}

.employee-detail-form {
  width: 100%;
}

.employee-detail-access {
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.employee-detail-access__title {
  margin: 0;
  font-family: var(--font-display);
  font-size: var(--text-lg);
}

.employee-detail-access__chips {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
}

.employee-detail-access__chip {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--space-xs) 0;
  border-bottom: 1px solid var(--border-subtle);
}

.employee-detail-access__chip:last-child {
  border-bottom: none;
}

.employee-detail-access__chip-title {
  font-size: var(--text-label-size);
  color: var(--ink-primary);
}

.employee-detail-access__chip-role {
  font-size: var(--text-caption-size);
  color: var(--ink-muted);
}

.employee-detail-access__footer {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-xs);
}

:deep(.form-content__viewport) {
  flex: 0 1 auto;
  overflow: visible;
  min-height: 0;
  padding: 0;
  gap: 0;
}

.error-message {
  color: var(--semantic-error);
  font-size: var(--text-body-size);
  margin: 0;
}

.inline-link {
  color: var(--brand-primary);
  margin-left: var(--space-xs);
}

.section-placeholder,
.loading-state {
  color: var(--ink-tertiary);
  font-size: var(--text-body-size);
  margin: 0;
}
</style>
